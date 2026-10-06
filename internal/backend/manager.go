package backend

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
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
	if path, err := exec.LookPath(CliName); err == nil {
		return &Manager{bin: path, stopped: make(chan struct{})}, nil
	}
	// GUI launches (App Menu, .desktop entry) inherit a stripped session
	// PATH without the shell rc entries, so a plain LookPath can miss a
	// backend that is visible from a terminal. On POSIX systems retry
	// with the login shell PATH imported once, then resolve CliName
	// against the merged list. The CLI name stays literal, no install
	// locations are hardcoded here. Windows has no login shell concept,
	// so it keeps the plain LookPath result.
	if runtime.GOOS != "windows" {
		if path, ok := lookPathViaLoginShell(); ok {
			return &Manager{bin: path, stopped: make(chan struct{})}, nil
		}
	}
	// Dev context goes to stderr only; the returned error is for users.
	fmt.Fprintf(os.Stderr, "[backend] not found: %q is not on PATH\n", CliName)
	return nil, ErrBackendNotFound
}

// loginShellBudget bounds the total time spent asking login shells for PATH.
const loginShellBudget = 3 * time.Second

const loginPathMarkerStart = "__CODRYN_PATH_START__"
const loginPathMarkerEnd = "__CODRYN_PATH_END__"

// shellCandidatesFunc and queryShellPathFunc are vars so tests can stub
// the login shell without spawning real shells.
var shellCandidatesFunc = shellCandidates
var queryShellPathFunc = queryShellPath

// lookPathViaLoginShell resolves CliName against the merged PATH of the
// current process and the user login shell. It never spawns the backend,
// it only asks shells for their PATH value.
func lookPathViaLoginShell() (string, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), loginShellBudget)
	defer cancel()
	loginPath := ""
	for _, shell := range shellCandidatesFunc() {
		out, err := queryShellPathFunc(ctx, shell)
		if err != nil {
			continue
		}
		if p, ok := extractMarkedPath(out); ok {
			loginPath = p
			break
		}
	}
	if loginPath == "" {
		return "", false
	}
	merged := mergePathLists(loginPath, os.Getenv("PATH"))
	if hit := findExecutableInList(CliName, merged); hit != "" {
		return hit, true
	}
	return "", false
}

// shellCandidates returns the shells to ask for PATH, primary first.
// SHELL is the user configured shell, /bin/sh is the POSIX fallback that
// covers non-POSIX primary shells (fish, nushell) whose syntax differs.
func shellCandidates() []string {
	seen := map[string]bool{}
	out := []string{}
	if sh := strings.TrimSpace(os.Getenv("SHELL")); sh != "" {
		seen[sh] = true
		out = append(out, sh)
	}
	if !seen["/bin/sh"] {
		out = append(out, "/bin/sh")
	}
	return out
}

// queryShellPath asks one shell for its PATH value. The fixed argv carries
// no user input, so there is no shell injection surface. Markers around
// the value keep rc banners or echoes from contaminating the result.
// Interactive login (-ilc) sources both profile and rc files, so PATH
// entries kept in interactive rc files are covered too.
func queryShellPath(ctx context.Context, shell string) (string, error) {
	cmd := exec.CommandContext(ctx, shell, "-ilc",
		"printf '"+loginPathMarkerStart+"%s"+loginPathMarkerEnd+"' \"$PATH\"")
	var stdout bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = io.Discard
	if err := cmd.Run(); err != nil {
		return "", err
	}
	return stdout.String(), nil
}

// extractMarkedPath returns the PATH value between the markers.
func extractMarkedPath(output string) (string, bool) {
	start := strings.Index(output, loginPathMarkerStart)
	if start < 0 {
		return "", false
	}
	rest := output[start+len(loginPathMarkerStart):]
	end := strings.Index(rest, loginPathMarkerEnd)
	if end < 0 {
		return "", false
	}
	p := strings.TrimSpace(rest[:end])
	if p == "" {
		return "", false
	}
	return p, true
}

// mergePathLists unions login and current PATH entries, login first,
// dropping duplicates and empty entries.
func mergePathLists(login, current string) []string {
	seen := map[string]bool{}
	out := []string{}
	for _, list := range []string{login, current} {
		for _, d := range strings.Split(list, string(os.PathListSeparator)) {
			d = strings.TrimSpace(d)
			if d == "" || seen[d] {
				continue
			}
			seen[d] = true
			out = append(out, d)
		}
	}
	return out
}

// findExecutableInList searches name in dirs, mirroring LookPath without
// consulting the process PATH. On Windows it also tries PATHEXT so a
// literal CliName still resolves to its .exe.
func findExecutableInList(name string, dirs []string) string {
	candidates := []string{name}
	if runtime.GOOS == "windows" {
		exts := []string{".exe", ".bat", ".cmd", ".com"}
		if pathext := os.Getenv("PATHEXT"); pathext != "" {
			exts = nil
			for _, e := range strings.Split(pathext, ";") {
				e = strings.TrimSpace(e)
				if e == "" {
					continue
				}
				if !strings.HasPrefix(e, ".") {
					e = "." + e
				}
				exts = append(exts, strings.ToLower(e))
			}
		}
		lower := strings.ToLower(name)
		hasExt := false
		for _, e := range exts {
			if strings.HasSuffix(lower, e) {
				hasExt = true
				break
			}
		}
		if !hasExt {
			for _, e := range exts {
				candidates = append(candidates, name+e)
			}
		}
	}
	for _, dir := range dirs {
		for _, c := range candidates {
			full := filepath.Join(dir, c)
			if isExecutableFile(full) {
				return full
			}
		}
	}
	return ""
}

// isExecutableFile reports whether path is a file executable by someone.
// Windows has no exec bits, so a plain file is enough there.
func isExecutableFile(path string) bool {
	info, err := os.Stat(path)
	if err != nil || info.IsDir() {
		return false
	}
	if runtime.GOOS == "windows" {
		return true
	}
	return info.Mode()&0o111 != 0
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
