package stream

import (
	"context"
	"errors"
	"fmt"
	"io"
	"sync"
	"time"

	"codryn/desktop/internal/client"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	watchReconnectInitial = 500 * time.Millisecond
	watchReconnectMax     = 2 * time.Second
)

type FileWatchService struct {
	c             *client.Client
	appCtx        context.Context
	mu            sync.Mutex
	activeWatches map[string]context.CancelFunc
}

func NewFileWatchService(c *client.Client) *FileWatchService {
	return &FileWatchService{
		c:             c,
		activeWatches: make(map[string]context.CancelFunc),
	}
}

func (s *FileWatchService) SetAppContext(ctx context.Context) {
	s.appCtx = ctx
}

func (s *FileWatchService) StartWatch(workspaceID string) (string, error) {
	streamID := fmt.Sprintf("fw-%d", time.Now().UnixNano())
	ctx, cancel := context.WithCancel(context.Background())

	s.mu.Lock()
	s.activeWatches[streamID] = cancel
	s.mu.Unlock()

	go s.watchLoop(ctx, streamID, workspaceID)
	return streamID, nil
}

func (s *FileWatchService) watchLoop(ctx context.Context, streamID, workspaceID string) {
	defer func() {
		s.mu.Lock()
		delete(s.activeWatches, streamID)
		s.mu.Unlock()
	}()

	backoff := watchReconnectInitial
	for {
		if ctx.Err() != nil {
			return
		}

		err := s.watchOnce(ctx, streamID, workspaceID)
		if err == nil || ctx.Err() != nil {
			return
		}

		runtime.EventsEmit(s.appCtx, "file:watch-error", streamID, err.Error())

		select {
		case <-ctx.Done():
			return
		case <-time.After(backoff):
		}
		backoff *= 2
		if backoff > watchReconnectMax {
			backoff = watchReconnectMax
		}
	}
}

// watchOnce drains the stream until it ends or ctx is cancelled. A stream
// that closes on its own (backend restart, idle drop) is reported as an error
// so watchLoop reconnects; a ctx cancellation stops cleanly.
func (s *FileWatchService) watchOnce(ctx context.Context, streamID, workspaceID string) error {
	sr, err := s.c.OpenStream("GET", "/workspaces/"+workspaceID+"/files/events", nil, nil)
	if err != nil {
		return err
	}

	// OpenStream does not accept the ctx, so a blocked ReadEvent is unblocked
	// by Close when the watch is stopped; Close also asks the backend to
	// cancel the stream.
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
				return fmt.Errorf("file watch stream ended")
			}
			return fmt.Errorf("file watch stream ended: %w", err)
		}

		runtime.EventsEmit(s.appCtx, "file:watch-event", streamID, string(event))
	}
}

func (s *FileWatchService) StopWatch(streamID string) error {
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
