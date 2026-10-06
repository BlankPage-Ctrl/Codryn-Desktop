package backend

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestNewManagerFromEnvFindsCodrynOnPath(t *testing.T) {
	dir := t.TempDir()
	name := "codryn"
	if runtime.GOOS == "windows" {
		name += ".exe"
	}
	fake := filepath.Join(dir, name)
	if err := os.WriteFile(fake, []byte("#!/bin/sh\nexit 0\n"), 0o755); err != nil {
		t.Fatalf("write fake codryn: %v", err)
	}
	t.Setenv("PATH", dir)
	m, err := NewManagerFromEnv()
	if err != nil {
		t.Fatalf("NewManagerFromEnv: %v", err)
	}
	if m.bin != fake {
		t.Fatalf("bin = %q, want %q", m.bin, fake)
	}
}

func TestNewManagerFromEnvMissingCodryn(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Setenv("PATH", t.TempDir())
		if _, err := NewManagerFromEnv(); err != ErrBackendNotFound {
			t.Fatalf("err = %v, want ErrBackendNotFound", err)
		}
		return
	}
	// Stub the login shell out so the test is hermetic: the real login
	// shell could know a real backend on the dev machine.
	oldCandidates := shellCandidatesFunc
	oldQuery := queryShellPathFunc
	defer func() { shellCandidatesFunc = oldCandidates; queryShellPathFunc = oldQuery }()
	shellCandidatesFunc = func() []string { return []string{"/bin/no-such-shell"} }
	queryShellPathFunc = func(ctx context.Context, shell string) (string, error) {
		return "", errors.New("no shell")
	}
	t.Setenv("PATH", t.TempDir())
	if _, err := NewManagerFromEnv(); err != ErrBackendNotFound {
		t.Fatalf("err = %v, want ErrBackendNotFound", err)
	}
}

func TestNewManagerFromEnvViaLoginShell(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("login shell import is POSIX only")
	}
	dir := t.TempDir()
	fake := filepath.Join(dir, "codryn")
	if err := os.WriteFile(fake, []byte("#!/bin/sh\nexit 0\n"), 0o755); err != nil {
		t.Fatalf("write fake codryn: %v", err)
	}
	oldCandidates := shellCandidatesFunc
	oldQuery := queryShellPathFunc
	defer func() { shellCandidatesFunc = oldCandidates; queryShellPathFunc = oldQuery }()
	shellCandidatesFunc = func() []string { return []string{"/bin/fake-shell"} }
	queryShellPathFunc = func(ctx context.Context, shell string) (string, error) {
		return "banner noise\n" + loginPathMarkerStart + dir + loginPathMarkerEnd + "\n", nil
	}
	// Process PATH is empty on purpose: only the login shell knows the dir.
	t.Setenv("PATH", t.TempDir())
	m, err := NewManagerFromEnv()
	if err != nil {
		t.Fatalf("NewManagerFromEnv: %v", err)
	}
	if m.bin != fake {
		t.Fatalf("bin = %q, want %q", m.bin, fake)
	}
}

func TestExtractMarkedPathIgnoresBanner(t *testing.T) {
	out := "motd line\n" + loginPathMarkerStart + "/a:/b" + loginPathMarkerEnd + "\n"
	got, ok := extractMarkedPath(out)
	if !ok || got != "/a:/b" {
		t.Fatalf("got %q,%v want %q,true", got, ok, "/a:/b")
	}
	if _, ok := extractMarkedPath("no markers here"); ok {
		t.Fatalf("expected no match without markers")
	}
	if _, ok := extractMarkedPath(loginPathMarkerStart + "   " + loginPathMarkerEnd); ok {
		t.Fatalf("expected no match for empty value")
	}
}

func TestMergePathListsDedupes(t *testing.T) {
	sep := string(os.PathListSeparator)
	got := mergePathLists("a"+sep+"b", "b"+sep+"c"+sep+"")
	want := []string{"a", "b", "c"}
	if len(got) != len(want) {
		t.Fatalf("got %q want %q", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("got %q want %q", got, want)
		}
	}
}

func TestFindExecutableInListSkipsNonExecutable(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("exec bits are POSIX only")
	}
	dir := t.TempDir()
	plain := filepath.Join(dir, "codryn")
	if err := os.WriteFile(plain, []byte("#!/bin/sh\nexit 0\n"), 0o644); err != nil {
		t.Fatalf("write file: %v", err)
	}
	if hit := findExecutableInList("codryn", []string{dir}); hit != "" {
		t.Fatalf("hit = %q, want empty for non-executable", hit)
	}
	if err := os.Chmod(plain, 0o755); err != nil {
		t.Fatalf("chmod: %v", err)
	}
	if hit := findExecutableInList("codryn", []string{dir}); hit != plain {
		t.Fatalf("hit = %q, want %q", hit, plain)
	}
}

func TestLoginShellMarkersDoNotLeakBackendPath(t *testing.T) {
	// Regression guard for the constraint: no install location may be
	// hardcoded in the resolver. The login shell output is dynamic.
	for _, s := range []string{loginPathMarkerStart, loginPathMarkerEnd} {
		if strings.Contains(s, "codryn") {
			t.Fatalf("marker %q must not contain a backend path", s)
		}
	}
}

func TestCommandUsesServeStdio(t *testing.T) {
	m := &Manager{bin: "codryn"}
	cmd := m.command()
	args := cmd.Args[1:]
	if len(args) < 2 || args[0] != "serve" || args[1] != "stdio" {
		t.Fatalf("cli args = %q, want [serve stdio ...]", args)
	}
}
