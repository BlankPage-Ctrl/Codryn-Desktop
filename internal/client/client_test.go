package client

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"strings"
	"testing"
)

func TestNilTransportReturnsCleanError(t *testing.T) {
	c := NewWithTransport(nil)
	if _, err := c.Do("GET", "/workspaces", nil, nil); !errors.Is(err, ErrNoTransport) {
		t.Fatalf("Do err = %v, want ErrNoTransport", err)
	}
	if _, err := c.DoStream("GET", "/workspaces", nil, nil); !errors.Is(err, ErrNoTransport) {
		t.Fatalf("DoStream err = %v, want ErrNoTransport", err)
	}
	if _, err := c.OpenStream("GET", "/workspaces", nil, nil); !errors.Is(err, ErrNoTransport) {
		t.Fatalf("OpenStream err = %v, want ErrNoTransport", err)
	}
	if _, err := DoOK[[]string](c, "GET", "/workspaces", nil, nil); !errors.Is(err, ErrNoTransport) {
		t.Fatalf("DoOK err = %v, want ErrNoTransport wrapped", err)
	}
}

func TestSortQueryString(t *testing.T) {
	tests := []struct {
		in   string
		want string
	}{
		{"", ""},
		{"a=1", "a=1"},
		{"id=abc12&limit=5&search=note", "id=abc12&limit=5&search=note"},
		{"z=9&a=1&m=4", "a=1&m=4&z=9"},
	}
	for _, tt := range tests {
		if got := sortQueryString(tt.in); got != tt.want {
			t.Errorf("sortQueryString(%q) = %q, want %q", tt.in, got, tt.want)
		}
	}
}

func TestBuildCanonicalMatchesVerifierContract(t *testing.T) {
	bodyHash := sha256.Sum256([]byte(""))
	bodyHashHex := hex.EncodeToString(bodyHash[:])

	want := strings.Join([]string{
		"GET",
		"/workspaces",
		"id=abc12&limit=5&search=note",
		"1234567890",
		"req-test12345678",
		bodyHashHex,
	}, "\n")

	got := buildCanonical("get", "/workspaces", "id=abc12&limit=5&search=note", "1234567890", "req-test12345678", "")

	if got != want {
		t.Errorf("canonical mismatch\n got: %q\nwant: %q", got, want)
	}
}
