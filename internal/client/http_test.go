package client

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHTTPTransportOpenStream(t *testing.T) {
	events := []map[string]any{
		{"type": "created", "path": "/a.txt"},
		{"type": "modified", "path": "/b.txt"},
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		w.WriteHeader(http.StatusOK)
		fl := w.(http.Flusher)
		for _, ev := range events {
			raw, err := json.Marshal(ev)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			fmt.Fprintf(w, "data: %s\n\n", raw)
			fl.Flush()
		}
	}))
	defer srv.Close()

	tr := NewHTTPTransport(srv.URL, DefaultClientID, DefaultSecretKey)
	read, err := tr.OpenStream("GET", "/workspaces/ws-1/files/events", nil, nil)
	if err != nil {
		t.Fatalf("OpenStream: %v", err)
	}
	defer read.Close()

	for i, want := range events {
		got, err := read.ReadEvent()
		if err != nil {
			t.Fatalf("ReadEvent %d: %v", i, err)
		}
		var m map[string]any
		if err := json.Unmarshal(got, &m); err != nil {
			t.Fatalf("event %d not JSON: %v (raw=%s)", i, err, got)
		}
		if m["path"] != want["path"] {
			t.Fatalf("event %d path = %v, want %v", i, m["path"], want["path"])
		}
	}

	if err := read.Close(); err != nil {
		t.Fatalf("Close: %v", err)
	}
}

func TestHTTPTransportOpenStreamEOFOnServerEnd(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		w.WriteHeader(http.StatusOK)
		fl := w.(http.Flusher)
		fmt.Fprintf(w, "data: {\"type\":\"created\",\"path\":\"/only.txt\"}\n\n")
		fl.Flush()
	}))
	defer srv.Close()

	tr := NewHTTPTransport(srv.URL, DefaultClientID, DefaultSecretKey)
	read, err := tr.OpenStream("GET", "/workspaces/ws-1/files/events", nil, nil)
	if err != nil {
		t.Fatalf("OpenStream: %v", err)
	}
	defer read.Close()

	if _, err := read.ReadEvent(); err != nil {
		t.Fatalf("first ReadEvent: %v", err)
	}
	if _, err := read.ReadEvent(); !errors.Is(err, io.EOF) {
		t.Fatalf("expected io.EOF after server end, got: %v", err)
	}
}
