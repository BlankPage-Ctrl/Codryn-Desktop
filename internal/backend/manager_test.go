package backend

import (
	"os"
	"path/filepath"
	"runtime"
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
	t.Setenv("PATH", t.TempDir())
	if _, err := NewManagerFromEnv(); err != ErrBackendNotFound {
		t.Fatalf("err = %v, want ErrBackendNotFound", err)
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
