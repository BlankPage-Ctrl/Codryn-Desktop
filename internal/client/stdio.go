package client

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

// rpcTimeout bounds a single non-streaming JSON-RPC round-trip.
const rpcTimeout = 30 * time.Second

// StdioTransport speaks JSON-RPC 2.0 over newline-delimited JSON to a spawned
// backend child process (TRANSPORT=stdio). The backend writes protocol data to
// stdout only; all logs go to stderr.
type StdioTransport struct {
	stdin  io.WriteCloser
	stdout io.ReadCloser
	logf   func(format string, args ...any)

	nextID  atomic.Int64
	mu      sync.Mutex
	pending map[string]chan *rpcMessage
	streams map[string]*stdioStream
	closed  chan struct{}
}

func NewStdioTransport(stdin io.WriteCloser, stdout io.ReadCloser) *StdioTransport {
	t := &StdioTransport{
		stdin:   stdin,
		stdout:  stdout,
		logf:    func(string, ...any) {},
		pending: make(map[string]chan *rpcMessage),
		streams: make(map[string]*stdioStream),
		closed:  make(chan struct{}),
	}
	go t.readLoop()
	return t
}

func (t *StdioTransport) SetLogger(f func(format string, args ...any)) {
	if f != nil {
		t.logf = f
	}
}

// Do fulfills the Transport interface. Non-stream routes do a synchronous
// round-trip; stream routes (send.message, watch.file) return a synthetic
// HTTP response whose body is an SSE-shaped stream fed by JSON-RPC
// notifications, so the existing stream services work unchanged.
func (t *StdioTransport) Do(method, path string, body any, query map[string]string) (*http.Response, error) {
	route, err := mapRoute(method, path)
	if err != nil {
		return nil, err
	}
	params, err := route.buildParams(path, body, query)
	if err != nil {
		return nil, fmt.Errorf("stdio: build params for %s %s: %w", method, path, err)
	}
	if route.stream {
		return t.doStream(route, params)
	}
	return t.doCall(route.rpc, params)
}

func (t *StdioTransport) DoStream(method, path string, body any, query map[string]string) (*http.Response, error) {
	return t.Do(method, path, body, query)
}

func (t *StdioTransport) newID() string {
	return strconv.FormatInt(t.nextID.Add(1), 10)
}

func (t *StdioTransport) writeLine(body []byte) error {
	t.mu.Lock()
	defer t.mu.Unlock()
	if t.stdin == nil {
		return fmt.Errorf("stdio: stdin not connected")
	}
	if _, err := t.stdin.Write(append(body, '\n')); err != nil {
		return fmt.Errorf("stdio: write: %w", err)
	}
	return nil
}

func (t *StdioTransport) doCall(method string, params any) (*http.Response, error) {
	id := t.newID()
	ch := make(chan *rpcMessage, 1)
	t.mu.Lock()
	t.pending[id] = ch
	t.mu.Unlock()
	defer func() {
		t.mu.Lock()
		delete(t.pending, id)
		t.mu.Unlock()
	}()

	if err := t.send(id, method, params); err != nil {
		return nil, err
	}

	select {
	case msg := <-ch:
		return rpcResponseToHTTP(msg)
	case <-time.After(rpcTimeout):
		return nil, fmt.Errorf("stdio: request %s timed out", method)
	case <-t.closed:
		return nil, fmt.Errorf("stdio: backend closed")
	}
}

func (t *StdioTransport) doStream(route *stdioRoute, params any) (*http.Response, error) {
	reader, err := t.openStream(route, params)
	if err != nil {
		return nil, err
	}
	pr, pw := io.Pipe()
	go func() {
		defer pw.Close()
		for {
			event, err := reader.ReadEvent()
			if err != nil {
				return
			}
			line := append([]byte("data: "), event...)
			line = append(line, '\n')
			if _, err := pw.Write(line); err != nil {
				return
			}
		}
	}()
	return &http.Response{
		StatusCode: http.StatusOK,
		Status:     "200 OK",
		Header: http.Header{
			"Content-Type": []string{"text/event-stream"},
		},
		Body: pr,
	}, nil
}

func (t *StdioTransport) OpenStream(method, path string, body any, query map[string]string) (StreamReader, error) {
	route, err := mapRoute(method, path)
	if err != nil {
		return nil, err
	}
	params, err := route.buildParams(path, body, query)
	if err != nil {
		return nil, fmt.Errorf("stdio: build params for %s %s: %w", method, path, err)
	}
	return t.openStream(route, params)
}

func (t *StdioTransport) openStream(route *stdioRoute, params any) (*stdioStreamReader, error) {
	id := t.newID()
	st := newStdioStream(route.convert)

	t.mu.Lock()
	t.streams[id] = st
	t.mu.Unlock()

	cleanup := func() {
		t.mu.Lock()
		delete(t.streams, id)
		t.mu.Unlock()
		st.finish()
	}

	if err := t.send(id, route.rpc, params); err != nil {
		cleanup()
		return nil, err
	}

	return &stdioStreamReader{t: t, id: id, st: st, cleanup: cleanup}, nil
}

type stdioStreamReader struct {
	t       *StdioTransport
	id      string
	st      *stdioStream
	cleanup func()
	once    sync.Once
}

func (r *stdioStreamReader) ReadEvent() ([]byte, error) {
	raw, ok := <-r.st.ch
	if !ok {
		return nil, io.EOF
	}
	data, err := r.st.convert(raw)
	if err != nil {
		return nil, fmt.Errorf("stdio: convert stream event: %w", err)
	}
	return data, nil
}

func (r *stdioStreamReader) Close() error {
	r.once.Do(func() {
		_ = r.t.sendCancel(r.id)
		r.cleanup()
	})
	return nil
}

func (t *StdioTransport) sendCancel(requestID string) error {
	return t.writeNotification("cancel", map[string]any{"requestId": requestID})
}

func (t *StdioTransport) writeNotification(method string, params any) error {
	body, err := json.Marshal(map[string]any{
		"jsonrpc": "2.0",
		"method":  method,
		"params":  params,
	})
	if err != nil {
		return fmt.Errorf("stdio: marshal notification: %w", err)
	}
	return t.writeLine(body)
}

func (t *StdioTransport) send(id, method string, params any) error {
	req := rpcRequest{JSONRPC: "2.0", ID: id, Method: method, Params: params}
	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("stdio: marshal request: %w", err)
	}
	return t.writeLine(body)
}

func (t *StdioTransport) readLoop() {
	defer close(t.closed)

	scanner := bufio.NewScanner(t.stdout)
	scanner.Buffer(make([]byte, 0, 64*1024), 8*1024*1024)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		var msg rpcMessage
		if err := json.Unmarshal([]byte(line), &msg); err != nil {
			t.logf("stdio: drop unparsable line: %v", err)
			continue
		}
		t.route(&msg)
	}

	// stdout closed -> the backend is gone. Fail everything still in flight.
	t.mu.Lock()
	for id, ch := range t.pending {
		select {
		case ch <- &rpcMessage{Error: &rpcError{Code: -32603, Message: "backend exited"}}:
		default:
		}
		delete(t.pending, id)
	}
	for id, sp := range t.streams {
		sp.finish()
		delete(t.streams, id)
	}
	t.mu.Unlock()
}

func (t *StdioTransport) route(msg *rpcMessage) {
	if msg.ID != nil {
		id := rpcIDString(*msg.ID)
		t.mu.Lock()
		if ch, ok := t.pending[id]; ok {
			delete(t.pending, id)
			t.mu.Unlock()
			select {
			case ch <- msg:
			case <-t.closed:
			}
			return
		}
		if sp, ok := t.streams[id]; ok {
			// final result for a stream -> EOF on the SSE body
			delete(t.streams, id)
			t.mu.Unlock()
			sp.finish()
			return
		}
		t.mu.Unlock()
		return
	}

	if msg.Method == "" || len(msg.Params) == 0 {
		return
	}
	rid := extractRequestID(msg.Params)
	if rid == "" {
		return
	}
	t.mu.Lock()
	sp, ok := t.streams[rid]
	t.mu.Unlock()
	if ok {
		sp.writeNotification(msg.Params)
	}
}

type rpcRequest struct {
	JSONRPC string `json:"jsonrpc"`
	ID      string `json:"id"`
	Method  string `json:"method"`
	Params  any    `json:"params"`
}

type rpcMessage struct {
	JSONRPC string           `json:"jsonrpc"`
	ID      *json.RawMessage `json:"id"`
	Method  string           `json:"method"`
	Params  json.RawMessage  `json:"params"`
	Result  json.RawMessage  `json:"result"`
	Error   *rpcError        `json:"error"`
}

type rpcError struct {
	Code    int             `json:"code"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
}

func rpcIDString(raw json.RawMessage) string {
	var s string
	if json.Unmarshal(raw, &s) == nil {
		return s
	}
	var n json.Number
	if json.Unmarshal(raw, &n) == nil {
		return n.String()
	}
	return string(raw)
}

func extractRequestID(params json.RawMessage) string {
	var p struct {
		RequestID any `json:"requestId"`
	}
	if len(params) == 0 || json.Unmarshal(params, &p) != nil {
		return ""
	}
	switch v := p.RequestID.(type) {
	case string:
		return v
	case float64:
		return strconv.FormatInt(int64(v), 10)
	}
	return ""
}

// rpcResponseToHTTP shapes a JSON-RPC response into the same HTTP envelope the
// real backend produces.
func rpcResponseToHTTP(msg *rpcMessage) (*http.Response, error) {
	now := time.Now().UTC().Format(time.RFC3339)

	if msg.Error != nil {
		status, code := rpcErrorStatus(msg.Error)
		env := Envelope{
			RequestID:  "req-stdio",
			ResponseID: "resp-stdio",
			Status:     status,
			Timestamp:  now,
			Data:       json.RawMessage("null"),
			Error:      &APIError{Code: code, Message: msg.Error.Message},
		}
		raw, _ := json.Marshal(env)
		return &http.Response{
			StatusCode: status,
			Status:     fmt.Sprintf("%d %s", status, http.StatusText(status)),
			Header:     http.Header{"Content-Type": []string{"application/json"}},
			Body:       io.NopCloser(bytes.NewReader(raw)),
		}, nil
	}

	env := Envelope{
		RequestID:  "req-stdio",
		ResponseID: "resp-stdio",
		Status:     http.StatusOK,
		Timestamp:  now,
		Data:       msg.Result,
	}
	raw, _ := json.Marshal(env)
	return &http.Response{
		StatusCode: http.StatusOK,
		Status:     "200 OK",
		Header:     http.Header{"Content-Type": []string{"application/json"}},
		Body:       io.NopCloser(bytes.NewReader(raw)),
	}, nil
}

func rpcErrorStatus(e *rpcError) (int, string) {
	status := http.StatusInternalServerError
	code := e.Message
	if len(e.Data) > 0 {
		var d struct {
			Status int    `json:"status"`
			Code   string `json:"code"`
		}
		if json.Unmarshal(e.Data, &d) == nil {
			if d.Status > 0 {
				status = d.Status
			}
			if d.Code != "" {
				code = d.Code
			}
		}
	}
	return status, code
}

type stdioStream struct {
	ch      chan json.RawMessage
	convert func(json.RawMessage) ([]byte, error)
	once    sync.Once
}

func newStdioStream(convert func(json.RawMessage) ([]byte, error)) *stdioStream {
	return &stdioStream{ch: make(chan json.RawMessage, 32), convert: convert}
}

func (s *stdioStream) writeNotification(params json.RawMessage) {
	select {
	case s.ch <- params:
	default:
		// slow consumer; drop so the reader loop never blocks
	}
}

// finish signals EOF to readers of the stream.
func (s *stdioStream) finish() {
	s.once.Do(func() { close(s.ch) })
}

type stdioRoute struct {
	verb    string
	re      *regexp.Regexp
	rpc     string
	stream  bool
	convert func(json.RawMessage) ([]byte, error)
	build   func(ids []string, body any, query map[string]string) (any, error)
}

func (r *stdioRoute) buildParams(path string, body any, query map[string]string) (any, error) {
	ids := r.re.FindStringSubmatch(path)
	if len(ids) == 0 {
		return nil, fmt.Errorf("stdio: path %q did not match %s", path, r.re.String())
	}
	return r.build(ids[1:], body, query)
}

var stdioRoutes = []stdioRoute{
	// workspaces
	{verb: "GET", re: re(`^/workspaces$`), rpc: "list.workspace", build: noParams},
	{verb: "POST", re: re(`^/workspaces$`), rpc: "create.workspace", build: directBody},
	{verb: "GET", re: re(`^/workspaces/([^/]+)$`), rpc: "get.workspace", build: params("id")},
	{verb: "PATCH", re: re(`^/workspaces/([^/]+)$`), rpc: "update.workspace", build: patchBody},
	{verb: "DELETE", re: re(`^/workspaces/([^/]+)$`), rpc: "delete.workspace", build: params("id")},

	// chats
	{verb: "GET", re: re(`^/workspaces/([^/]+)/chats$`), rpc: "list.chat", build: params("workspaceId")},
	{verb: "POST", re: re(`^/workspaces/([^/]+)/chats$`), rpc: "create.chat", build: extendBody("workspaceId")},
	{verb: "GET", re: re(`^/workspaces/([^/]+)/chats/([^/]+)$`), rpc: "get.chat", build: params("workspaceId", "id")},
	{verb: "POST", re: re(`^/workspaces/([^/]+)/chats/([^/]+)/title$`), rpc: "generate.chat-title", build: buildChatTitle},
	{verb: "PATCH", re: re(`^/workspaces/([^/]+)/chats/([^/]+)$`), rpc: "update.chat", build: extendBody("workspaceId", "id")},
	{verb: "DELETE", re: re(`^/workspaces/([^/]+)/chats/([^/]+)$`), rpc: "delete.chat", build: params("workspaceId", "id")},

	// messages
	{verb: "GET", re: re(`^/workspaces/([^/]+)/chats/([^/]+)/messages$`), rpc: "list.message", build: params("workspaceId", "chatId")},
	{verb: "GET", re: re(`^/workspaces/([^/]+)/chats/([^/]+)/usage$`), rpc: "get.chat-usage", build: params("workspaceId", "chatId")},
	{verb: "GET", re: re(`^/workspaces/([^/]+)/chats/([^/]+)/messages/([^/]+)/usage$`), rpc: "get.message-usage", build: params("workspaceId", "chatId", "messageId")},
	{verb: "POST", re: re(`^/workspaces/([^/]+)/chats/([^/]+)/revert/preview$`), rpc: "preview.message-run", build: extendBody("workspaceId", "chatId")},
	{verb: "POST", re: re(`^/workspaces/([^/]+)/chats/([^/]+)/revert$`), rpc: "revert.message-run", build: extendBody("workspaceId", "chatId")},

	// attachments
	{verb: "POST", re: re(`^/workspaces/([^/]+)/attachments$`), rpc: "upload.attachment", build: extendBody("workspaceId")},
	{verb: "GET", re: re(`^/workspaces/([^/]+)/attachments/([^/]+)$`), rpc: "get.attachment", build: params("workspaceId", "attachmentId")},

	// runs
	{verb: "POST", re: re(`^/workspaces/([^/]+)/chats/([^/]+)/runs$`), rpc: "start.message-run", build: buildStartRun},
	{verb: "GET", re: re(`^/workspaces/([^/]+)/chats/([^/]+)/runs$`), rpc: "list.message-run", build: params("workspaceId", "chatId")},
	{verb: "GET", re: re(`^/workspaces/([^/]+)/chats/([^/]+)/runs/([^/]+)$`), rpc: "get.message-run", build: params("workspaceId", "chatId", "runId")},
	{verb: "DELETE", re: re(`^/workspaces/([^/]+)/chats/([^/]+)/runs/([^/]+)$`), rpc: "cancel.message-run", build: params("workspaceId", "chatId", "runId")},
	{verb: "GET", re: re(`^/workspaces/([^/]+)/chats/([^/]+)/runs/([^/]+)/stream$`), rpc: "watch.message-run", stream: true, convert: runChunk, build: buildWatchRun},

	// file manager
	{verb: "GET", re: re(`^/workspaces/([^/]+)/files$`), rpc: "list.file", build: buildFileList},
	{verb: "GET", re: re(`^/workspaces/([^/]+)/files/stat$`), rpc: "get.stat", build: buildFileList},
	{verb: "GET", re: re(`^/workspaces/([^/]+)/files/read$`), rpc: "read.file", build: buildReadFile},
	{verb: "GET", re: re(`^/workspaces/([^/]+)/files/search$`), rpc: "search.file", build: buildSearchFiles},
	{verb: "GET", re: re(`^/workspaces/([^/]+)/files/events$`), rpc: "watch.file", stream: true, convert: fileEvent, build: params("workspaceId")},

	// providers (types must match before {id})
	{verb: "GET", re: re(`^/providers$`), rpc: "list.provider", build: noParams},
	{verb: "POST", re: re(`^/providers$`), rpc: "create.provider", build: directBody},
	{verb: "GET", re: re(`^/providers/types$`), rpc: "list.provider-types", build: noParams},
	{verb: "GET", re: re(`^/providers/([^/]+)$`), rpc: "get.provider", build: params("id")},
	{verb: "PATCH", re: re(`^/providers/([^/]+)$`), rpc: "update.provider", build: patchBody},
	{verb: "DELETE", re: re(`^/providers/([^/]+)$`), rpc: "delete.provider", build: params("id")},

	// models
	{verb: "GET", re: re(`^/providers/([^/]+)/models$`), rpc: "list.model", build: params("providerId")},
	{verb: "POST", re: re(`^/providers/([^/]+)/models$`), rpc: "create.model", build: modelInput},
	{verb: "PATCH", re: re(`^/providers/([^/]+)/models/([^/]+)$`), rpc: "update.model", build: patchBody},
	{verb: "DELETE", re: re(`^/providers/([^/]+)/models/([^/]+)$`), rpc: "delete.model", build: paramsLastID},

	// notes (workspace-scoped)
	{verb: "GET", re: re(`^/workspaces/([^/]+)/notes$`), rpc: "list.note", build: buildListNotes},
	{verb: "GET", re: re(`^/workspaces/([^/]+)/notes/([^/]+)$`), rpc: "get.note", build: params("workspaceId", "id")},
	{verb: "POST", re: re(`^/workspaces/([^/]+)/notes$`), rpc: "create.note", build: buildCreateNote},
	{verb: "PATCH", re: re(`^/workspaces/([^/]+)/notes/([^/]+)$`), rpc: "update.note", build: buildUpdateNote},
	{verb: "DELETE", re: re(`^/workspaces/([^/]+)/notes/([^/]+)$`), rpc: "delete.note", build: params("workspaceId", "id")},
	{verb: "POST", re: re(`^/workspaces/([^/]+)/notes/([^/]+)/move$`), rpc: "move.note", build: buildMoveNote},
	{verb: "POST", re: re(`^/workspaces/([^/]+)/notes-renumber$`), rpc: "renumber.note", build: params("workspaceId")},

	// categories (workspace-scoped)
	{verb: "GET", re: re(`^/workspaces/([^/]+)/categories$`), rpc: "list.category", build: params("workspaceId")},
	{verb: "POST", re: re(`^/workspaces/([^/]+)/categories$`), rpc: "create.category", build: buildCreateCategory},
	{verb: "PATCH", re: re(`^/workspaces/([^/]+)/categories/([^/]+)$`), rpc: "rename.category", build: buildRenameCategory},
	{verb: "DELETE", re: re(`^/workspaces/([^/]+)/categories/([^/]+)$`), rpc: "delete.category", build: params("workspaceId", "id")},

	// hitl
	{verb: "GET", re: re(`^/hitl/requests/pending$`), rpc: "list.pending.hitl", build: noParams},
	{verb: "GET", re: re(`^/hitl/requests/events$`), rpc: "watch.hitl", stream: true, convert: hitlEvent, build: noParams},
	{verb: "POST", re: re(`^/hitl/requests$`), rpc: "request.hitl", build: directBody},
	{verb: "GET", re: re(`^/hitl/requests/([^/]+)$`), rpc: "get.hitl", build: params("id")},
	{verb: "POST", re: re(`^/hitl/requests/([^/]+)/response$`), rpc: "submit.hitl", build: extendBody("id")},
	{verb: "POST", re: re(`^/hitl/requests/([^/]+)/cancel$`), rpc: "cancel.hitl", build: extendBody("id")},

	// settings
	{verb: "GET", re: re(`^/settings/([^/]+)$`), rpc: "get.setting", build: params("key")},
	{verb: "PUT", re: re(`^/settings/([^/]+)$`), rpc: "set.setting", build: setSetting},

	// insight
	{verb: "POST", re: re(`^/workspaces/([^/]+)/insight/ensure$`), rpc: "ensure.insight", build: params("workspaceId")},
	{verb: "GET", re: re(`^/workspaces/([^/]+)/insight/status$`), rpc: "get.insight-status", build: params("workspaceId")},
	{verb: "DELETE", re: re(`^/workspaces/([^/]+)/insight$`), rpc: "stop.insight", build: params("workspaceId")},
	{verb: "POST", re: re(`^/workspaces/([^/]+)/insight/sync$`), rpc: "sync.insight", build: params("workspaceId")},
	{verb: "POST", re: re(`^/workspaces/([^/]+)/insight/index$`), rpc: "index.insight", build: extendBody("workspaceId")},
	{verb: "GET", re: re(`^/workspaces/([^/]+)/insight/index/status$`), rpc: "index-status.insight", build: params("workspaceId")},
	{verb: "GET", re: re(`^/workspaces/([^/]+)/insight/search$`), rpc: "search.insight", build: buildInsightSearch},

	// mcp
	{verb: "GET", re: re(`^/workspaces/([^/]+)/mcp/servers$`), rpc: "list.mcp-server", build: params("workspaceId")},
	{verb: "PUT", re: re(`^/workspaces/([^/]+)/mcp/servers/([^/]+)$`), rpc: "set.mcp-server", build: extendBody("workspaceId", "name")},
}

func re(pattern string) *regexp.Regexp {
	return regexp.MustCompile(pattern)
}

func mapRoute(verb, path string) (*stdioRoute, error) {
	for i := range stdioRoutes {
		r := &stdioRoutes[i]
		if r.verb == verb && r.re.MatchString(path) {
			return r, nil
		}
	}
	return nil, fmt.Errorf("stdio: no RPC mapping for %s %s", verb, path)
}

func noParams([]string, any, map[string]string) (any, error) {
	return map[string]any{}, nil
}

func directBody(_ []string, body any, _ map[string]string) (any, error) {
	return body, nil
}

func params(names ...string) func([]string, any, map[string]string) (any, error) {
	return func(ids []string, _ any, _ map[string]string) (any, error) {
		m := make(map[string]any, len(names))
		for i, name := range names {
			m[name] = ids[i]
		}
		return m, nil
	}
}

func extendBody(names ...string) func([]string, any, map[string]string) (any, error) {
	return func(ids []string, body any, _ map[string]string) (any, error) {
		m := make(map[string]any, len(names)+1)
		for i, name := range names {
			m[name] = ids[i]
		}
		for k, v := range bodyToMap(body) {
			m[k] = v
		}
		return m, nil
	}
}

// patchBody builds {id, patch}; id is the last path param.
func patchBody(ids []string, body any, _ map[string]string) (any, error) {
	return map[string]any{"id": ids[len(ids)-1], "patch": body}, nil
}

func paramsLastID(ids []string, _ any, _ map[string]string) (any, error) {
	return map[string]any{"id": ids[len(ids)-1]}, nil
}

func modelInput(ids []string, body any, _ map[string]string) (any, error) {
	return map[string]any{"providerId": ids[0], "input": body}, nil
}

func moveNote(ids []string, body any, _ map[string]string) (any, error) {
	return map[string]any{"id": ids[0], "position": body}, nil
}

func setSetting(ids []string, body any, _ map[string]string) (any, error) {
	m := bodyToMap(body)
	value, _ := m["value"]
	return map[string]any{"key": ids[0], "value": value}, nil
}

func buildFileList(ids []string, _ any, query map[string]string) (any, error) {
	return map[string]any{"workspaceId": ids[0], "path": query["path"]}, nil
}

func buildReadFile(ids []string, _ any, query map[string]string) (any, error) {
	m := map[string]any{"workspaceId": ids[0], "path": query["path"]}
	if q := query["maxBytes"]; q != "" {
		if n, err := strconv.Atoi(q); err == nil {
			m["maxBytes"] = n
		}
	}
	return m, nil
}

func buildSearchFiles(ids []string, _ any, query map[string]string) (any, error) {
	m := map[string]any{"workspaceId": ids[0], "path": query["path"], "query": query["query"]}
	if q := query["maxResults"]; q != "" {
		if n, err := strconv.Atoi(q); err == nil {
			m["maxResults"] = n
		}
	}
	if q := query["maxDepth"]; q != "" {
		if n, err := strconv.Atoi(q); err == nil {
			m["maxDepth"] = n
		}
	}
	return m, nil
}

func buildChatTitle(ids []string, body any, _ map[string]string) (any, error) {
	m := bodyToMap(body)
	m["workspaceId"] = ids[0]
	m["id"] = ids[1]
	return m, nil
}

func buildStartRun(ids []string, body any, _ map[string]string) (any, error) {
	m := bodyToMap(body)
	message, _ := m["message"].(map[string]any)
	if message == nil {
		message = map[string]any{}
	}
	return map[string]any{"workspaceId": ids[0], "chatId": ids[1], "message": message}, nil
}

func buildWatchRun(ids []string, _ any, query map[string]string) (any, error) {
	m := map[string]any{"workspaceId": ids[0], "chatId": ids[1], "runId": ids[2]}
	if q := query["afterSeq"]; q != "" {
		if n, err := strconv.Atoi(q); err == nil {
			m["afterSeq"] = n
		}
	}
	return m, nil
}

func buildListNotes(ids []string, _ any, query map[string]string) (any, error) {
	m := make(map[string]any, len(query)+1)
	m["workspaceId"] = ids[0]
	for k, v := range query {
		m[k] = v
	}
	return m, nil
}

func buildCreateNote(ids []string, body any, _ map[string]string) (any, error) {
	m := bodyToMap(body)
	m["workspaceId"] = ids[0]
	return m, nil
}

func buildUpdateNote(ids []string, body any, _ map[string]string) (any, error) {
	return map[string]any{"workspaceId": ids[0], "id": ids[1], "patch": body}, nil
}

func buildMoveNote(ids []string, body any, _ map[string]string) (any, error) {
	return map[string]any{"workspaceId": ids[0], "id": ids[1], "position": body}, nil
}

func buildCreateCategory(ids []string, body any, _ map[string]string) (any, error) {
	m := bodyToMap(body)
	m["workspaceId"] = ids[0]
	return m, nil
}

func buildRenameCategory(ids []string, body any, _ map[string]string) (any, error) {
	m := bodyToMap(body)
	name, _ := m["name"].(string)
	return map[string]any{"workspaceId": ids[0], "id": ids[1], "name": name}, nil
}

func buildInsightSearch(ids []string, _ any, query map[string]string) (any, error) {
	m := map[string]any{"workspaceId": ids[0]}
	if v := query["query"]; v != "" {
		m["query"] = v
	}
	if v := query["mode"]; v != "" {
		m["mode"] = v
	}
	if v := query["limit"]; v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			m["limit"] = n
		}
	}
	if v := query["file"]; v != "" {
		m["file"] = v
	}
	if v := query["container"]; v != "" {
		m["container"] = v
	}
	return m, nil
}

func queryToObject(_ []string, _ any, query map[string]string) (any, error) {
	m := make(map[string]any, len(query))
	for k, v := range query {
		m[k] = v
	}
	return m, nil
}

func bodyToMap(body any) map[string]any {
	if body == nil {
		return map[string]any{}
	}
	b, err := json.Marshal(body)
	if err != nil {
		return map[string]any{}
	}
	var m map[string]any
	if err := json.Unmarshal(b, &m); err != nil {
		return map[string]any{}
	}
	return m
}

func runChunk(params json.RawMessage) ([]byte, error) {
	var p struct {
		Event json.RawMessage `json:"event"`
	}
	if err := json.Unmarshal(params, &p); err != nil {
		return nil, err
	}
	return p.Event, nil
}

func fileEvent(params json.RawMessage) ([]byte, error) {
	var p struct {
		Event json.RawMessage `json:"event"`
	}
	if err := json.Unmarshal(params, &p); err != nil {
		return nil, err
	}
	return p.Event, nil
}

func hitlEvent(params json.RawMessage) ([]byte, error) {
	var p struct {
		Event json.RawMessage `json:"event"`
	}
	if err := json.Unmarshal(params, &p); err != nil {
		return nil, err
	}
	return p.Event, nil
}
