package mockapi

import (
	"net/http"
)

func (s *Store) handleListChats(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("workspaceId")
	chats := s.Chats.Filter(func(c Chat) bool { return c.WorkspaceID == wsID })
	writeJSON(w, r, http.StatusOK, chats)
}

func (s *Store) handleGetChat(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("workspaceId")
	id := r.PathValue("id")
	chat, ok := s.Chats.Find(func(c Chat) bool { return c.ID == id })
	if !ok || chat.WorkspaceID != wsID {
		writeError(w, r, http.StatusNotFound, "Chat "+id+" not found")
		return
	}
	writeJSON(w, r, http.StatusOK, chat)
}

func (s *Store) handleCreateChat(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("workspaceId")
	var body struct {
		Title        string  `json:"title"`
		ProviderID   *string `json:"providerId"`
		ModelID      *string `json:"modelId"`
		SystemPrompt *string `json:"systemPrompt"`
		ThinkingMode string  `json:"thinkingMode"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid body")
		return
	}
	now := ts()
	chat := Chat{
		ID:           newID(),
		Title:        body.Title,
		ProviderID:   body.ProviderID,
		ModelID:      body.ModelID,
		SystemPrompt: body.SystemPrompt,
		ThinkingMode: body.ThinkingMode,
		WorkspaceID:  wsID,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	s.Chats.Add(chat)
	writeJSON(w, r, http.StatusCreated, chat)
}

func (s *Store) handleUpdateChat(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("workspaceId")
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := readBody(r, &body); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid body")
		return
	}
	ok := s.Chats.Update(func(c Chat) bool { return c.ID == id && c.WorkspaceID == wsID }, func(chat *Chat) {
		if v, ok := body["title"].(string); ok {
			chat.Title = v
		}
		if v, ok := body["providerId"].(string); ok {
			chat.ProviderID = &v
		}
		if v, ok := body["modelId"].(string); ok {
			chat.ModelID = &v
		}
		if v, ok := body["systemPrompt"].(string); ok {
			chat.SystemPrompt = &v
		}
		if v, ok := body["thinkingMode"].(string); ok {
			chat.ThinkingMode = v
		}
		chat.UpdatedAt = ts()
	})
	if !ok {
		writeError(w, r, http.StatusNotFound, "Chat "+id+" not found")
		return
	}
	chat, _ := s.Chats.Find(func(c Chat) bool { return c.ID == id })
	writeJSON(w, r, http.StatusOK, chat)
}

func (s *Store) handleDeleteChat(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !s.Chats.Remove(func(c Chat) bool { return c.ID == id }) {
		writeError(w, r, http.StatusNotFound, "Chat "+id+" not found")
		return
	}
	writeNoContent(w)
}

func (s *Store) handleGetMessages(w http.ResponseWriter, r *http.Request) {
	chatID := r.PathValue("chatId")
	events := historyFeedEvents(chatID, s.Messages)
	if events == nil {
		events = []map[string]any{}
	}
	writeJSON(w, r, http.StatusOK, events)
}

func (s *Store) handleRevertMessages(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("workspaceId")
	chatID := r.PathValue("chatId")

	chat, ok := s.Chats.Find(func(c Chat) bool { return c.ID == chatID && c.WorkspaceID == wsID })
	if !ok {
		writeError(w, r, http.StatusNotFound, "Chat "+chatID+" not found")
		return
	}

	var body struct {
		MessageID    string `json:"messageId"`
		Mode         string `json:"mode"`
		RestoreFiles bool   `json:"restoreFiles"`
	}
	if err := readBody(r, &body); err != nil || body.MessageID == "" {
		writeError(w, r, http.StatusBadRequest, "body.messageId is required")
		return
	}

	cancelled := []string{}
	for _, run := range s.Runs.Filter(func(m MockRun) bool {
		return m.ChatID == chat.ID && m.WorkspaceID == wsID && m.Status == "running"
	}) {
		cancelled = append(cancelled, run.RunID)
	}
	for _, runID := range cancelled {
		s.Runs.Update(
			func(m MockRun) bool { return m.RunID == runID },
			func(m *MockRun) { m.Status = "cancelled" },
		)
	}

	idx := -1
	for i, m := range s.Messages {
		if m.ID == body.MessageID {
			idx = i
			break
		}
	}
	if idx < 0 {
		writeError(w, r, http.StatusNotFound, "Message "+body.MessageID+" not found")
		return
	}
	deleted := []string{}
	for _, m := range s.Messages[idx:] {
		deleted = append(deleted, m.ID)
	}
	s.Messages = append([]mockMessage{}, s.Messages[:idx]...)

	writeJSON(w, r, http.StatusOK, map[string]any{
		"deletedMessageIds": deleted,
		"cancelledRunIds":   cancelled,
		// The mock has no file-history ledger; report an empty file plan
		// for shape parity when the client asks for a file revert.
		"fileRestore": fileRestoreOrNil(body.RestoreFiles),
	})
}

func fileRestoreOrNil(restore bool) map[string]any {
	if !restore {
		return nil
	}
	return map[string]any{"restored": []string{}, "conflicts": []string{}}
}

// handlePreviewRevertMessages mirrors the backend preview.message-run
// action: read-only revert scope plus an (empty) file plan. The mock has
// no file-history ledger, so files is always empty.
func (s *Store) handlePreviewRevertMessages(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("workspaceId")
	chatID := r.PathValue("chatId")

	chat, ok := s.Chats.Find(func(c Chat) bool { return c.ID == chatID && c.WorkspaceID == wsID })
	if !ok {
		writeError(w, r, http.StatusNotFound, "Chat "+chatID+" not found")
		return
	}

	var body struct {
		MessageID string `json:"messageId"`
		Mode      string `json:"mode"`
	}
	if err := readBody(r, &body); err != nil || body.MessageID == "" {
		writeError(w, r, http.StatusBadRequest, "body.messageId is required")
		return
	}

	idx := -1
	for i, m := range s.Messages {
		if m.ID == body.MessageID {
			idx = i
			break
		}
	}
	if idx < 0 {
		writeError(w, r, http.StatusNotFound, "Message "+body.MessageID+" not found")
		return
	}
	suffix := []string{}
	for _, m := range s.Messages[idx:] {
		suffix = append(suffix, m.ID)
	}

	_ = chat
	writeJSON(w, r, http.StatusOK, map[string]any{
		"targetMessageId": body.MessageID,
		"fromPosition":    idx,
		"suffixIds":       suffix,
		"files":           []map[string]any{},
	})
}

// historyFeedEvents converts stored mock messages into custom chat-feed
// history events (mirrors apps/shared/chat-feed replayHistory: completed
// open+delta+close triples with role, no runId on the mock path).
func historyFeedEvents(chatID string, msgs []mockMessage) []map[string]any {
	events := []map[string]any{}
	emit := func(obj map[string]any) { events = append(events, obj) }
	for _, m := range msgs {
		scope := map[string]any{"chatId": chatID, "messageId": m.ID, "role": m.Role}
		stage := 0
		for i, part := range m.Parts {
			sliceID := part.ToolCallID
			if sliceID == "" {
				sliceID = m.ID + ":p" + itoa(i)
			}
			switch part.Type {
			case "text":
				if part.Text == "" {
					continue
				}
				emit(merge(scope, map[string]any{"type": "text-open", "sliceId": sliceID}))
				emit(merge(scope, map[string]any{"type": "text-delta", "sliceId": sliceID, "delta": part.Text}))
				emit(merge(scope, map[string]any{"type": "text-close", "sliceId": sliceID}))
			case "reasoning":
				if part.Text == "" {
					continue
				}
				emit(merge(scope, map[string]any{"type": "think-open", "sliceId": sliceID}))
				emit(merge(scope, map[string]any{"type": "think-delta", "sliceId": sliceID, "delta": part.Text}))
				emit(merge(scope, map[string]any{"type": "think-close", "sliceId": sliceID}))
			case "step-start":
				emit(merge(scope, map[string]any{"type": "stage-open", "stage": stage}))
				stage++
			default:
				if len(part.Type) > 5 && part.Type[:5] == "tool-" {
					toolName := part.Type[5:]
					callID := part.ToolCallID
					if callID == "" {
						callID = sliceID
					}
					emit(merge(scope, map[string]any{
						"type": "work-queued", "sliceId": callID, "callId": callID, "implement": toolName,
					}))
					emit(merge(scope, map[string]any{
						"type": "work-active", "sliceId": callID, "callId": callID,
						"implement": toolName, "input": part.Input,
					}))
					if part.Output != nil {
						emit(merge(scope, map[string]any{
							"type": "work-ok", "sliceId": callID, "callId": callID,
							"implement": toolName, "input": part.Input, "output": part.Output,
						}))
					}
				}
			}
		}
	}
	return events
}

func merge(base, over map[string]any) map[string]any {
	out := make(map[string]any, len(base)+len(over))
	for k, v := range base {
		out[k] = v
	}
	for k, v := range over {
		out[k] = v
	}
	return out
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	digits := []byte{}
	for n > 0 {
		digits = append([]byte{byte('0' + n%10)}, digits...)
		n /= 10
	}
	return string(digits)
}
