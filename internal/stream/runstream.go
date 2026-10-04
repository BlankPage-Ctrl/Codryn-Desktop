package stream

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strconv"
	"sync"

	"codryn/desktop/internal/client"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// RunInfo mirrors the backend RunRecord JSON shape.
type RunInfo struct {
	RunID              string `json:"runId"`
	ChatID             string `json:"chatId"`
	WorkspaceID        string `json:"workspaceId"`
	AssistantMessageID string `json:"assistantMessageId"`
	Status             string `json:"status"`
}

// StartRunResult is the payload of POST .../runs (HTTP 202).
type StartRunResult struct {
	RunID              string `json:"runId"`
	AssistantMessageId string `json:"assistantMessageId"`
	Status             string `json:"status"`
}

// RunStreamService drives the backend run system from the desktop shell.
//
// Lifecycle contract (background-first):
//   - StartRun launches an agent run and returns immediately. The run keeps
//     going on the backend even if nobody watches it.
//   - WatchRun attaches an SSE watcher (replay from afterSeq, then live).
//     UnwatchRun detaches the watcher ONLY - the run keeps going.
//   - CancelRun aborts the agent run server-side (DELETE). This is the only
//     call that stops generation.
type RunStreamService struct {
	c             *client.Client
	appCtx        context.Context
	mu            sync.Mutex
	activeWatches map[string]context.CancelFunc
}

func NewRunStreamService(c *client.Client) *RunStreamService {
	return &RunStreamService{
		c:             c,
		activeWatches: make(map[string]context.CancelFunc),
	}
}

func (s *RunStreamService) SetAppContext(ctx context.Context) {
	s.appCtx = ctx
}

func (s *RunStreamService) StartRun(workspaceID, chatID, bodyJSON string) (StartRunResult, error) {
	var zero StartRunResult
	var body any
	if err := json.Unmarshal([]byte(bodyJSON), &body); err != nil {
		return zero, fmt.Errorf("run: invalid message body: %w", err)
	}
	res, err := client.DoOK[StartRunResult](
		s.c, "POST",
		"/workspaces/"+workspaceID+"/chats/"+chatID+"/runs",
		body, nil,
	)
	if err != nil {
		return zero, err
	}
	return res, nil
}

func (s *RunStreamService) GetRun(workspaceID, chatID, runID string) (RunInfo, error) {
	return client.DoOK[RunInfo](
		s.c, "GET",
		"/workspaces/"+workspaceID+"/chats/"+chatID+"/runs/"+runID,
		nil, nil,
	)
}

func (s *RunStreamService) ListRuns(workspaceID, chatID string) ([]RunInfo, error) {
	runs, err := client.DoOK[[]RunInfo](
		s.c, "GET",
		"/workspaces/"+workspaceID+"/chats/"+chatID+"/runs",
		nil, nil,
	)
	if err != nil {
		return nil, err
	}
	if runs == nil {
		return []RunInfo{}, nil
	}
	return runs, nil
}

func (s *RunStreamService) CancelRun(workspaceID, chatID, runID string) (RunInfo, error) {
	return client.DoOK[RunInfo](
		s.c, "DELETE",
		"/workspaces/"+workspaceID+"/chats/"+chatID+"/runs/"+runID,
		nil, nil,
	)
}

func (s *RunStreamService) WatchRun(watchID, workspaceID, chatID, runID string, afterSeq int) {
	ctx, cancel := context.WithCancel(context.Background())

	s.mu.Lock()
	s.activeWatches[watchID] = cancel
	s.mu.Unlock()

	go s.watchLoop(ctx, watchID, workspaceID, chatID, runID, afterSeq)
}

func (s *RunStreamService) UnwatchRun(watchID string) {
	s.mu.Lock()
	cancel, ok := s.activeWatches[watchID]
	delete(s.activeWatches, watchID)
	s.mu.Unlock()
	if ok {
		cancel()
	}
}

func (s *RunStreamService) watchLoop(
	ctx context.Context,
	watchID, workspaceID, chatID, runID string,
	afterSeq int,
) {
	defer func() {
		s.mu.Lock()
		delete(s.activeWatches, watchID)
		s.mu.Unlock()
	}()

	sr, err := s.c.OpenStream(
		"GET",
		"/workspaces/"+workspaceID+"/chats/"+chatID+"/runs/"+runID+"/stream",
		nil,
		map[string]string{"afterSeq": strconv.Itoa(afterSeq)},
	)
	if err != nil {
		runtime.EventsEmit(s.appCtx, "run:error", watchID, err.Error())
		return
	}

	stop := make(chan struct{})
	go func() {
		select {
		case <-ctx.Done():
			_ = sr.Close()
		case <-stop:
		}
	}()
	defer close(stop)
	defer sr.Close()

	terminalSeen := false
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		event, err := sr.ReadEvent()
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			if errors.Is(err, io.EOF) {
				if !terminalSeen {
					runtime.EventsEmit(s.appCtx, "run:error", watchID, "run stream ended unexpectedly")
				}
				return
			}
			runtime.EventsEmit(s.appCtx, "run:error", watchID, err.Error())
			return
		}

		var frame struct {
			Type   string `json:"type"`
			Status string `json:"status"`
		}
		if err := json.Unmarshal(event, &frame); err != nil {
			runtime.EventsEmit(s.appCtx, "run:chunk", watchID, string(event))
			continue
		}
		// Terminal frame is the custom chat-feed `run-close` event
		// (status done|failed|cancelled). Everything else - text-delta,
		// work-*, stage-*, asset, notice, oops, run-open - is a chunk
		// for the frontend feed reducer.
		if frame.Type == "run-close" {
			terminalSeen = true
			if frame.Status == "done" {
				runtime.EventsEmit(s.appCtx, "run:done", watchID, string(event))
			} else {
				runtime.EventsEmit(s.appCtx, "run:error", watchID, string(event))
			}
			return
		}
		runtime.EventsEmit(s.appCtx, "run:chunk", watchID, string(event))
	}
}
