package client

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"
	"testing"
)

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
