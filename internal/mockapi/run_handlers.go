package mockapi

import (
	"fmt"
	"net/http"
	"strconv"
)

// MockRun mirrors the backend RunRecord JSON shape.
type MockRun struct {
	RunID              string `json:"runId"`
	ChatID             string `json:"chatId"`
	WorkspaceID        string `json:"workspaceId"`
	AssistantMessageID string `json:"assistantMessageId"`
	Status             string `json:"status"`
}

func (s *Store) findRun(wsID, chatID, runID string) (MockRun, bool) {
	return s.Runs.Find(func(r MockRun) bool {
		return r.RunID == runID && r.ChatID == chatID && r.WorkspaceID == wsID
	})
}

func (s *Store) handleStartRun(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("workspaceId")
	chatID := r.PathValue("chatId")

	chat, ok := s.Chats.Find(func(c Chat) bool { return c.ID == chatID && c.WorkspaceID == wsID })
	if !ok {
		writeError(w, r, http.StatusNotFound, "Chat "+chatID+" not found")
		return
	}

	var body struct {
		Message *struct {
			Role string `json:"role"`
		} `json:"message"`
	}
	if err := readBody(r, &body); err != nil || body.Message == nil {
		writeError(w, r, http.StatusBadRequest, "body.message is required")
		return
	}
	if body.Message.Role != "user" {
		writeError(w, r, http.StatusBadRequest, "only user messages are accepted")
		return
	}

	run := MockRun{
		RunID:              fmt.Sprintf("run_%s", newID()),
		ChatID:             chat.ID,
		WorkspaceID:        wsID,
		AssistantMessageID: fmt.Sprintf("msg_%s", newID()),
		Status:             "running",
	}
	s.Runs.Add(run)
	writeJSON(w, r, http.StatusAccepted, map[string]any{
		"runId":              run.RunID,
		"assistantMessageId": run.AssistantMessageID,
		"status":             run.Status,
	})
}

func (s *Store) handleListRuns(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("workspaceId")
	chatID := r.PathValue("chatId")
	runs := s.Runs.Filter(func(m MockRun) bool {
		return m.ChatID == chatID && m.WorkspaceID == wsID
	})
	if runs == nil {
		runs = []MockRun{}
	}
	writeJSON(w, r, http.StatusOK, runs)
}

func (s *Store) handleGetRun(w http.ResponseWriter, r *http.Request) {
	run, ok := s.findRun(r.PathValue("workspaceId"), r.PathValue("chatId"), r.PathValue("runId"))
	if !ok {
		writeError(w, r, http.StatusNotFound, "Run "+r.PathValue("runId")+" not found")
		return
	}
	writeJSON(w, r, http.StatusOK, run)
}

func (s *Store) handleCancelRun(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("workspaceId")
	chatID := r.PathValue("chatId")
	runID := r.PathValue("runId")
	updated := false
	s.Runs.Update(
		func(m MockRun) bool { return m.RunID == runID && m.ChatID == chatID && m.WorkspaceID == wsID },
		func(m *MockRun) {
			if m.Status == "running" {
				m.Status = "cancelled"
			}
			updated = true
		},
	)
	if !updated {
		writeError(w, r, http.StatusNotFound, "Run "+runID+" not found")
		return
	}
	run, _ := s.findRun(wsID, chatID, runID)
	writeJSON(w, r, http.StatusOK, run)
}

func (s *Store) handleWatchRun(w http.ResponseWriter, r *http.Request) {
	run, ok := s.findRun(r.PathValue("workspaceId"), r.PathValue("chatId"), r.PathValue("runId"))
	if !ok {
		writeError(w, r, http.StatusNotFound, "Run "+r.PathValue("runId")+" not found")
		return
	}

	afterSeq := 0
	if q := r.URL.Query().Get("afterSeq"); q != "" {
		if n, err := strconv.Atoi(q); err == nil && n > 0 {
			afterSeq = n
		}
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	flusher, ok := w.(http.Flusher)
	if !ok {
		writeError(w, r, http.StatusInternalServerError, "streaming not supported")
		return
	}

	seq := 0
	emit := func(obj map[string]any) {
		seq++
		if seq <= afterSeq {
			return
		}
		obj["seq"] = seq
		writeSSE(w, obj)
		flusher.Flush()
	}

	if run.Status == "running" {
		var assistantMsg *mockMessage
		for _, m := range s.Messages {
			if m.Role == "assistant" {
				assistantMsg = &m
				break
			}
		}
		if assistantMsg == nil {
			writeError(w, r, http.StatusInternalServerError, "No mock assistant message available")
			return
		}
		for _, obj := range feedEvents(run.RunID, run.ChatID, *assistantMsg, run.AssistantMessageID) {
			emit(obj)
		}
		emit(map[string]any{
			"type": "run-close", "runId": run.RunID, "chatId": run.ChatID,
			"assistantMessageId": run.AssistantMessageID, "status": "done",
		})
		return
	}

	emit(map[string]any{
		"type": "run-close", "runId": run.RunID, "chatId": run.ChatID,
		"assistantMessageId": run.AssistantMessageID, "status": run.Status,
	})
}
