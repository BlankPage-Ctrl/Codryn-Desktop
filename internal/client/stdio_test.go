package client

import (
	"bufio"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"
)

// stdioTestPair wires a StdioTransport to an in-test fake backend.
type stdioTestPair struct {
	t       *testing.T
	stdio   *StdioTransport
	backend *fakeBackend
}

type fakeBackend struct {
	requests chan string
	replies  chan []byte
}

func newFakeBackend() *fakeBackend {
	return &fakeBackend{requests: make(chan string, 64), replies: make(chan []byte, 64)}
}

func (f *fakeBackend) serve(t *testing.T, reqReader io.Reader, replyWriter io.Writer) {
	t.Helper()
	sc := bufio.NewScanner(reqReader)
	for sc.Scan() {
		line := sc.Text()
		select {
		case f.requests <- line:
		default:
		}
	}
	// client closed its stdin -> close the reply side so the transport sees EOF
	if c, ok := replyWriter.(io.Closer); ok {
		_ = c.Close()
	}
}

func newStdioTestPair(t *testing.T) *stdioTestPair {
	t.Helper()

	// transport.stdin <- clientWrite (transport writes requests)
	// fake reads requests   <- backendRead
	backendRead, clientWrite := io.Pipe()
	// transport.stdout <- clientRead (transport reads replies)
	// fake writes replies  -> backendWrite
	clientRead, backendWrite := io.Pipe()

	fake := newFakeBackend()
	go fake.serve(t, backendRead, backendWrite)

	stdio := NewStdioTransport(clientWrite, clientRead)

	done := make(chan struct{})
	go func() {
		defer close(done)
		for raw := range fake.replies {
			_, _ = backendWrite.Write(append(raw, '\n'))
		}
		_ = backendWrite.Close()
	}()

	t.Cleanup(func() {
		_ = clientWrite.Close() // transport stdin EOF -> fake serve returns
		close(fake.replies)
		<-done
		_ = clientRead.Close()
	})

	return &stdioTestPair{t: t, stdio: stdio, backend: fake}
}

// respond queues a JSON-RPC response/notification from the fake backend.
func (p *stdioTestPair) respond(obj map[string]any) {
	raw, err := json.Marshal(obj)
	if err != nil {
		p.t.Fatalf("marshal response: %v", err)
	}
	select {
	case p.backend.replies <- raw:
	default:
		p.t.Fatal("fake backend reply buffer full")
	}
}

// nextRequest returns the first JSON-RPC request the transport wrote.
func (p *stdioTestPair) nextRequest() map[string]any {
	select {
	case line := <-p.backend.requests:
		var m map[string]any
		if err := json.Unmarshal([]byte(line), &m); err != nil {
			p.t.Fatalf("parse request %q: %v", line, err)
		}
		return m
	case <-time.After(2 * time.Second):
		p.t.Fatal("no request received from transport (timeout)")
		return nil
	}
}

func TestStdioDoPlainCall(t *testing.T) {
	p := newStdioTestPair(t)

	respCh := make(chan *http.Response, 1)
	errCh := make(chan error, 1)
	go func() {
		resp, err := p.stdio.Do("POST", "/workspaces", map[string]any{"name": "My WS", "projectPath": "/tmp"}, nil)
		respCh <- resp
		errCh <- err
	}()

	req := p.nextRequest()
	if req["method"] != "create.workspace" {
		t.Fatalf("method = %v, want create.workspace", req["method"])
	}
	id, _ := req["id"].(string)
	if id == "" {
		t.Fatalf("missing id in request: %v", req)
	}

	params := req["params"].(map[string]any)
	if params["name"] != "My WS" || params["projectPath"] != "/tmp" {
		t.Fatalf("unexpected params: %v", params)
	}

	p.respond(map[string]any{
		"jsonrpc": "2.0",
		"id":      id,
		"result": map[string]any{
			"id": "ws-1", "name": "My WS", "projectPath": "/tmp",
			"createdAt": "2026-01-01T00:00:00Z", "updatedAt": "2026-01-01T00:00:00Z",
		},
	})

	resp := <-respCh
	if err := <-errCh; err != nil {
		t.Fatalf("Do returned error: %v", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var env Envelope
	if err := json.Unmarshal(body, &env); err != nil {
		t.Fatalf("body not envelope: %v\nbody: %s", err, body)
	}
	var ws struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}
	if err := json.Unmarshal(env.Data, &ws); err != nil {
		t.Fatalf("unmarshal data: %v", err)
	}
	if ws.ID != "ws-1" || ws.Name != "My WS" {
		t.Fatalf("unexpected data: %+v", ws)
	}
}

func TestStdioDoErrorMapsStatus(t *testing.T) {
	p := newStdioTestPair(t)

	respCh := make(chan *http.Response, 1)
	errCh := make(chan error, 1)
	go func() {
		resp, err := p.stdio.Do("GET", "/workspaces/nope", nil, nil)
		respCh <- resp
		errCh <- err
	}()

	req := p.nextRequest()
	if req["method"] != "get.workspace" {
		t.Fatalf("method = %v, want get.workspace", req["method"])
	}

	p.respond(map[string]any{
		"jsonrpc": "2.0",
		"id":      req["id"].(string),
		"error": map[string]any{
			"code":    -32000,
			"message": "Resource not found",
			"data":    map[string]any{"code": "NOT_FOUND", "status": 404},
		},
	})

	resp := <-respCh
	if err := <-errCh; err != nil {
		t.Fatalf("Do returned error (should be status 404): %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 404 {
		t.Fatalf("status = %d, want 404", resp.StatusCode)
	}
	body, _ := io.ReadAll(resp.Body)
	var env Envelope
	if err := json.Unmarshal(body, &env); err != nil {
		t.Fatalf("body not envelope: %v", err)
	}
	if env.Error == nil || env.Error.Code != "NOT_FOUND" {
		t.Fatalf("expected NOT_FOUND error, got %+v", env.Error)
	}
}

func TestStdioOpenStreamWatch(t *testing.T) {
	p := newStdioTestPair(t)

	read, err := p.stdio.OpenStream("GET", "/workspaces/ws-1/files/events", nil, nil)
	if err != nil {
		t.Fatalf("OpenStream: %v", err)
	}
	defer read.Close()

	req := p.nextRequest()
	if req["method"] != "watch.file" {
		t.Fatalf("method = %v, want watch.file", req["method"])
	}
	id, _ := req["id"].(string)
	if id == "" {
		t.Fatalf("missing id in request: %v", req)
	}

	p.respond(map[string]any{
		"jsonrpc": "2.0",
		"method":  "file.event",
		"params":  map[string]any{"event": map[string]any{"type": "created", "path": "/ws/a.txt", "timestamp": float64(123)}, "requestId": id},
	})

	got, err := read.ReadEvent()
	if err != nil {
		t.Fatalf("ReadEvent: %v", err)
	}
	var gotEvent struct {
		Type string `json:"type"`
		Path string `json:"path"`
	}
	if err := json.Unmarshal(got, &gotEvent); err != nil {
		t.Fatalf("event not JSON: %v (raw=%s)", err, got)
	}
	if gotEvent.Path != "/ws/a.txt" || gotEvent.Type != "created" {
		t.Fatalf("unexpected event: %+v", gotEvent)
	}

	// Close must notify the backend so watchers/resources are released.
	if err := read.Close(); err != nil {
		t.Fatalf("Close: %v", err)
	}

	cancel := p.nextRequest()
	if cancel["method"] != "cancel" {
		t.Fatalf("method = %v, want cancel", cancel["method"])
	}
	params, ok := cancel["params"].(map[string]any)
	if !ok {
		t.Fatalf("cancel params missing: %v", cancel)
	}
	if params["requestId"] != id {
		t.Fatalf("requestId = %v, want %v", params["requestId"], id)
	}
}

func TestStdioOpenStreamHitlWatch(t *testing.T) {
	p := newStdioTestPair(t)

	read, err := p.stdio.OpenStream("GET", "/hitl/requests/events", nil, nil)
	if err != nil {
		t.Fatalf("OpenStream: %v", err)
	}
	defer read.Close()

	req := p.nextRequest()
	if req["method"] != "watch.hitl" {
		t.Fatalf("method = %v, want watch.hitl", req["method"])
	}
	id, _ := req["id"].(string)
	if id == "" {
		t.Fatalf("missing id in request: %v", req)
	}

	p.respond(map[string]any{
		"jsonrpc": "2.0",
		"method":  "hitl.event",
		"params":  map[string]any{"event": map[string]any{"type": "request", "request": map[string]any{"id": "req-1"}}, "requestId": id},
	})

	got, err := read.ReadEvent()
	if err != nil {
		t.Fatalf("ReadEvent: %v", err)
	}
	var gotEvent struct {
		Type    string `json:"type"`
		Request struct {
			ID string `json:"id"`
		} `json:"request"`
	}
	if err := json.Unmarshal(got, &gotEvent); err != nil {
		t.Fatalf("event not JSON: %v (raw=%s)", err, got)
	}
	if gotEvent.Type != "request" || gotEvent.Request.ID != "req-1" {
		t.Fatalf("unexpected event: %+v", gotEvent)
	}
}

func TestStdioOpenStreamEOFOnFinalResult(t *testing.T) {
	p := newStdioTestPair(t)

	read, err := p.stdio.OpenStream("GET", "/workspaces/ws-1/files/events", nil, nil)
	if err != nil {
		t.Fatalf("OpenStream: %v", err)
	}
	defer read.Close()

	req := p.nextRequest()
	id, _ := req["id"].(string)

	p.respond(map[string]any{
		"jsonrpc": "2.0",
		"id":      id,
		"result":  nil,
	})

	_, err = read.ReadEvent()
	if err != io.EOF {
		t.Fatalf("ReadEvent after final result = %v, want io.EOF", err)
	}
}

func TestStdioDoStreamRunWatch(t *testing.T) {
	p := newStdioTestPair(t)

	respCh := make(chan *http.Response, 1)
	errCh := make(chan error, 1)
	go func() {
		resp, err := p.stdio.DoStream("GET", "/workspaces/ws-1/chats/c-1/runs/r-1/stream",
			nil, map[string]string{"afterSeq": "0"})
		respCh <- resp
		errCh <- err
	}()

	req := p.nextRequest()
	if req["method"] != "watch.message-run" {
		t.Fatalf("method = %v, want watch.message-run", req["method"])
	}
	id, _ := req["id"].(string)

	p.respond(map[string]any{
		"jsonrpc": "2.0",
		"method":  "message.chunk",
		"params":  map[string]any{"event": map[string]any{"type": "text-delta", "text": "Hello"}, "runId": "r-1", "requestId": id},
	})
	p.respond(map[string]any{
		"jsonrpc": "2.0",
		"method":  "message.chunk",
		"params":  map[string]any{"event": map[string]any{"type": "text-delta", "text": " world"}, "runId": "r-1", "requestId": id},
	})
	p.respond(map[string]any{
		"jsonrpc": "2.0",
		"id":      id,
		"result":  map[string]any{"runId": "r-1", "status": "done"},
	})

	resp := <-respCh
	if err := <-errCh; err != nil {
		t.Fatalf("DoStream returned error: %v", err)
	}
	defer resp.Body.Close()

	sc := bufio.NewScanner(resp.Body)
	var lines []string
	for sc.Scan() {
		lines = append(lines, sc.Text())
	}
	if len(lines) != 2 {
		t.Fatalf("expected 2 SSE lines, got %d: %v", len(lines), lines)
	}
	want := []map[string]any{
		{"type": "text-delta", "text": "Hello"},
		{"type": "text-delta", "text": " world"},
	}
	for i, line := range lines {
		if !strings.HasPrefix(line, "data: ") {
			t.Fatalf("line %d not SSE data: %q", i, line)
		}
		var got map[string]any
		if err := json.Unmarshal([]byte(strings.TrimPrefix(line, "data: ")), &got); err != nil {
			t.Fatalf("line %d not JSON: %v", i, err)
		}
		if got["text"] != want[i]["text"] || got["type"] != want[i]["type"] {
			t.Errorf("line %d = %v, want %v", i, got, want[i])
		}
	}
}

func TestStdioRouteMapping(t *testing.T) {
	cases := []struct {
		verb, path, rpc string
	}{
		{"GET", "/workspaces", "list.workspace"},
		{"GET", "/workspaces/ws-1", "get.workspace"},
		{"POST", "/workspaces/ws-1/chats", "create.chat"},
		{"GET", "/workspaces/ws-1/chats/c-1/messages", "list.message"},
		{"GET", "/workspaces/ws-1/chats/c-1/usage", "get.chat-usage"},
		{"GET", "/workspaces/ws-1/chats/c-1/messages/m-1/usage", "get.message-usage"},
		{"POST", "/workspaces/ws-1/chats/c-1/revert/preview", "preview.message-run"},
		{"POST", "/workspaces/ws-1/chats/c-1/revert", "revert.message-run"},
		{"POST", "/workspaces/ws-1/attachments", "upload.attachment"},
		{"GET", "/workspaces/ws-1/attachments/a-1", "get.attachment"},
		{"POST", "/workspaces/ws-1/chats/c-1/runs", "start.message-run"},
		{"GET", "/workspaces/ws-1/chats/c-1/runs", "list.message-run"},
		{"GET", "/workspaces/ws-1/chats/c-1/runs/r-1", "get.message-run"},
		{"DELETE", "/workspaces/ws-1/chats/c-1/runs/r-1", "cancel.message-run"},
		{"GET", "/workspaces/ws-1/chats/c-1/runs/r-1/stream", "watch.message-run"},
		{"GET", "/workspaces/ws-1/files", "list.file"},
		{"GET", "/workspaces/ws-1/files/read", "read.file"},
		{"GET", "/workspaces/ws-1/files/search", "search.file"},
		{"GET", "/workspaces/ws-1/files/events", "watch.file"},
		{"GET", "/providers/types", "list.provider-types"},
		{"GET", "/providers/p-1/models", "list.model"},
		{"PATCH", "/providers/p-1/models/m-1", "update.model"},
		{"DELETE", "/providers/p-1/models/m-1", "delete.model"},
		{"GET", "/workspaces/ws-1/notes", "list.note"},
		{"POST", "/workspaces/ws-1/notes", "create.note"},
		{"GET", "/workspaces/ws-1/notes/n-1", "get.note"},
		{"PATCH", "/workspaces/ws-1/notes/n-1", "update.note"},
		{"DELETE", "/workspaces/ws-1/notes/n-1", "delete.note"},
		{"POST", "/workspaces/ws-1/notes/n-1/move", "move.note"},
		{"POST", "/workspaces/ws-1/notes-renumber", "renumber.note"},
		{"GET", "/workspaces/ws-1/categories", "list.category"},
		{"POST", "/workspaces/ws-1/categories", "create.category"},
		{"PATCH", "/workspaces/ws-1/categories/c-1", "rename.category"},
		{"DELETE", "/workspaces/ws-1/categories/c-1", "delete.category"},
		{"GET", "/hitl/requests/pending", "list.pending.hitl"},
		{"GET", "/hitl/requests/events", "watch.hitl"},
		{"POST", "/hitl/requests", "request.hitl"},
		{"GET", "/hitl/requests/req-1", "get.hitl"},
		{"POST", "/hitl/requests/req-1/response", "submit.hitl"},
		{"POST", "/hitl/requests/req-1/cancel", "cancel.hitl"},
		{"GET", "/settings/some-key", "get.setting"},
		{"PUT", "/settings/some-key", "set.setting"},
		{"GET", "/workspaces/ws-1/mcp/servers", "list.mcp-server"},
		{"PUT", "/workspaces/ws-1/mcp/servers/default-srv", "set.mcp-server"},
	}
	for _, c := range cases {
		route, err := mapRoute(c.verb, c.path)
		if err != nil {
			t.Errorf("%s %s: %v", c.verb, c.path, err)
			continue
		}
		if route.rpc != c.rpc {
			t.Errorf("%s %s -> %s, want %s", c.verb, c.path, route.rpc, c.rpc)
		}
	}
}
