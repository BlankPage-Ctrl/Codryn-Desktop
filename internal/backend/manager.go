package backend

import (
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"sync"
	"time"

	"codryn/desktop/internal/client"
)

const TransportStdio = "stdio"

var ErrBackendNotFound = errors.New("backend: Codryn backend not found. Please reinstall Codryn")

// CliName is the backend CLI invoked via OS PATH (the installer puts it
// there). On Windows exec.LookPath resolves it to codryn.exe via PATHEXT.
const CliName = "codryn"

// Config controls how the backend is spawned over STDIO.
type Config struct {
	LogFile string // where to tee backend stderr ("" = discard)
}

// Manager owns the backend child process. It hands the app a Transport bound
// to that process; Stop terminates the child cleanly.
type Manager struct {
	cfg       Config
	bin       string // resolved CliName on OS PATH
	cmd       *exec.Cmd
	transport client.Transport
	stdin     io.WriteCloser
	stopOnce  sync.Once
	stopped   chan struct{}
}

func NewManagerFromEnv() (*Manager, error) {
	path, err := exec.LookPath(CliName)
	if err != nil {
		// Dev context goes to stderr only; the returned error is for users.
		fmt.Fprintf(os.Stderr, "[backend] not found: %q is not on PATH\n", CliName)
		return nil, ErrBackendNotFound
	}
	return &Manager{bin: path, stopped: make(chan struct{})}, nil
}

// SetLogFile makes the backend write its stderr logs to the given path.
func (m *Manager) SetLogFile(path string) {
	m.cfg.LogFile = path
}

// Start spawns the backend over STDIO and returns the transport bound to it.
func (m *Manager) Start() (client.Transport, error) {
	return m.startStdio()
}

// Stop closes the child's stdin, then reaps it.
func (m *Manager) Stop() {
	m.stopOnce.Do(func() {
		close(m.stopped)
		if m.stdin != nil {
			_ = m.stdin.Close()
		}
		if m.cmd == nil {
			return
		}
		done := make(chan struct{})
		go func() {
			_ = m.cmd.Wait()
			close(done)
		}()
		select {
		case <-done:
		case <-time.After(3 * time.Second):
			_ = m.cmd.Process.Kill()
			<-done
		}
	})
}

func (m *Manager) startStdio() (client.Transport, error) {
	cmd := m.command()
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, fmt.Errorf("backend: stdin pipe: %w", err)
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("backend: stdout pipe: %w", err)
	}
	cmd.Stderr = m.logWriter()

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("backend: start: %w", err)
	}

	m.cmd = cmd
	m.stdin = stdin

	t := client.NewStdioTransport(stdin, stdout)
	t.SetLogger(func(format string, args ...any) {
		fmt.Fprintf(os.Stderr, "[backend:stdio] "+format+"\n", args...)
	})
	m.transport = t
	return t, nil
}

func (m *Manager) command() *exec.Cmd {
	// The codryn CLI speaks the explicit subcommand over STDIO. Data and
	// migrations locations are resolved by the backend itself.
	cmd := exec.Command(m.bin, "serve", "stdio")

	cmd.Env = os.Environ()
	cmd.Env = append(cmd.Env, "TRANSPORT="+TransportStdio)
	return cmd
}

// logWriter returns the backend stderr sink.
func (m *Manager) logWriter() io.Writer {
	if m.cfg.LogFile == "" {
		return io.Discard
	}
	f, err := os.OpenFile(m.cfg.LogFile, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
	if err != nil {
		return io.Discard
	}
	return f
}
