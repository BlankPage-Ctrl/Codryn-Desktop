package stream

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"sync"
	"time"

	"codryn/desktop/internal/client"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	shellExecReconnectInitial = 500 * time.Millisecond
	shellExecReconnectMax     = 2 * time.Second
)

// ShellExecWatchService subscribes to the backend shell-execution SSE stream
// for a single workspace and forwards each event to the frontend as a Wails
// runtime event named "shell:<type>" (shell:start, shell:chunk, shell:done,
// shell:error). The payload is the raw JSON string of the SSE data frame so
// the frontend can decode it. This mirrors HitlWatchService but is scoped per
// workspace via StartWatch(workspaceId).
type ShellExecWatchService struct {
	c             *client.Client
	appCtx        context.Context
	mu            sync.Mutex
	activeWatches map[string]context.CancelFunc
}

func NewShellExecWatchService(c *client.Client) *ShellExecWatchService {
	return &ShellExecWatchService{
		c:             c,
		activeWatches: make(map[string]context.CancelFunc),
	}
}

func (s *ShellExecWatchService) SetAppContext(ctx context.Context) {
	s.appCtx = ctx
}

func (s *ShellExecWatchService) StartWatch(workspaceId string) (string, error) {
	streamID := fmt.Sprintf("shellexec-%d", time.Now().UnixNano())
	ctx, cancel := context.WithCancel(context.Background())

	s.mu.Lock()
	s.activeWatches[streamID] = cancel
	s.mu.Unlock()

	go s.watchLoop(ctx, streamID, workspaceId)
	return streamID, nil
}

func (s *ShellExecWatchService) watchLoop(ctx context.Context, streamID string, workspaceId string) {
	defer func() {
		s.mu.Lock()
		delete(s.activeWatches, streamID)
		s.mu.Unlock()
	}()

	backoff := shellExecReconnectInitial
	for {
		if ctx.Err() != nil {
			return
		}

		err := s.watchOnce(ctx, streamID, workspaceId)
		if err == nil || ctx.Err() != nil {
			return
		}

		runtime.EventsEmit(s.appCtx, "shell:watch-error", streamID, err.Error())

		select {
		case <-ctx.Done():
			return
		case <-time.After(backoff):
		}
		backoff *= 2
		if backoff > shellExecReconnectMax {
			backoff = shellExecReconnectMax
		}
	}
}

func (s *ShellExecWatchService) watchOnce(ctx context.Context, streamID string, workspaceId string) error {
	path := "/workspaces/" + workspaceId + "/shell/events"
	sr, err := s.c.OpenStream("GET", path, nil, nil)
	if err != nil {
		return err
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

	for {
		select {
		case <-ctx.Done():
			return nil
		default:
		}

		event, err := sr.ReadEvent()
		if err != nil {
			if ctx.Err() != nil {
				return nil
			}
			if errors.Is(err, io.EOF) {
				return fmt.Errorf("shell exec watch stream ended")
			}
			return fmt.Errorf("shell exec watch stream ended: %w", err)
		}

		var envelope struct {
			Type string `json:"type"`
		}
		if json.Unmarshal(event, &envelope) != nil || envelope.Type == "" {
			runtime.EventsEmit(s.appCtx, "shell:event", streamID, string(event))
			continue
		}
		runtime.EventsEmit(s.appCtx, "shell:"+envelope.Type, streamID, string(event))
	}
}

func (s *ShellExecWatchService) StopWatch(streamID string) error {
	s.mu.Lock()
	cancel, ok := s.activeWatches[streamID]
	delete(s.activeWatches, streamID)
	s.mu.Unlock()
	if !ok {
		return fmt.Errorf("unknown stream: %s", streamID)
	}
	cancel()
	return nil
}
