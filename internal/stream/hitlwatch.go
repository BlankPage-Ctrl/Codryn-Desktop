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
	hitlReconnectInitial = 500 * time.Millisecond
	hitlReconnectMax     = 2 * time.Second
)

// HitlWatchService subscribes to the backend HITL SSE stream and forwards each
// event to the frontend as a Wails runtime event named "hitl:<type>" (e.g.
// hitl:request, hitl:resolved, hitl:cancelled, hitl:expired). The payload is the
// raw JSON string of the SSE data frame, so the frontend can decode it.
type HitlWatchService struct {
	c             *client.Client
	appCtx        context.Context
	mu            sync.Mutex
	activeWatches map[string]context.CancelFunc
}

func NewHitlWatchService(c *client.Client) *HitlWatchService {
	return &HitlWatchService{
		c:             c,
		activeWatches: make(map[string]context.CancelFunc),
	}
}

func (s *HitlWatchService) SetAppContext(ctx context.Context) {
	s.appCtx = ctx
}

func (s *HitlWatchService) StartWatch() (string, error) {
	streamID := fmt.Sprintf("hitl-%d", time.Now().UnixNano())
	ctx, cancel := context.WithCancel(context.Background())

	s.mu.Lock()
	s.activeWatches[streamID] = cancel
	s.mu.Unlock()

	go s.watchLoop(ctx, streamID)
	return streamID, nil
}

func (s *HitlWatchService) watchLoop(ctx context.Context, streamID string) {
	defer func() {
		s.mu.Lock()
		delete(s.activeWatches, streamID)
		s.mu.Unlock()
	}()

	backoff := hitlReconnectInitial
	for {
		if ctx.Err() != nil {
			return
		}

		err := s.watchOnce(ctx, streamID)
		if err == nil || ctx.Err() != nil {
			return
		}

		runtime.EventsEmit(s.appCtx, "hitl:watch-error", streamID, err.Error())

		select {
		case <-ctx.Done():
			return
		case <-time.After(backoff):
		}
		backoff *= 2
		if backoff > hitlReconnectMax {
			backoff = hitlReconnectMax
		}
	}
}

func (s *HitlWatchService) watchOnce(ctx context.Context, streamID string) error {
	sr, err := s.c.OpenStream("GET", "/hitl/requests/events", nil, nil)
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
				return fmt.Errorf("hitl watch stream ended")
			}
			return fmt.Errorf("hitl watch stream ended: %w", err)
		}

		var envelope struct {
			Type string `json:"type"`
		}
		if json.Unmarshal(event, &envelope) != nil || envelope.Type == "" {
			// Unknown frame shape: forward as a generic event.
			runtime.EventsEmit(s.appCtx, "hitl:event", streamID, string(event))
			continue
		}
		runtime.EventsEmit(s.appCtx, "hitl:"+envelope.Type, string(event))
	}
}

func (s *HitlWatchService) StopWatch(streamID string) error {
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
