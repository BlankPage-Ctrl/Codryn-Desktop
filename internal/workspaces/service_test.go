package workspaces

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"

	"codryn/desktop/internal/client"
)

// stubTransport replays one canned HTTP response for every call.
type stubTransport struct {
	status int
	body   string
}

func (s stubTransport) Do(method, path string, body any, queryParams map[string]string) (*http.Response, error) {
	return &http.Response{
		StatusCode: s.status,
		Status:     http.StatusText(s.status),
		Header:     http.Header{"Content-Type": []string{"application/json"}},
		Body:       io.NopCloser(strings.NewReader(s.body)),
	}, nil
}

func (s stubTransport) DoStream(method, path string, body any, queryParams map[string]string) (*http.Response, error) {
	return s.Do(method, path, body, queryParams)
}

func (s stubTransport) OpenStream(method, path string, body any, queryParams map[string]string) (client.StreamReader, error) {
	return nil, nil
}

func envelopeResult(t *testing.T, result any) string {
	t.Helper()
	raw, err := json.Marshal(result)
	if err != nil {
		t.Fatalf("marshal result: %v", err)
	}
	env := map[string]any{
		"requestId":  "req-test",
		"responseId": "resp-test",
		"status":     200,
		"timestamp":  "2026-10-06T00:00:00Z",
		"data":       json.RawMessage(raw),
	}
	out, err := json.Marshal(env)
	if err != nil {
		t.Fatalf("marshal envelope: %v", err)
	}
	return string(out)
}

func TestListReturnsEveryRow(t *testing.T) {
	rows := []map[string]any{
		{"id": "a", "name": "a", "description": "", "projectPath": "/p/a", "createdAt": "2026-10-04T09:44:20.133Z", "updatedAt": "2026-10-04T09:44:20.133Z"},
		{"id": "b", "name": "a", "description": "", "projectPath": "/p/a", "createdAt": "2026-10-06T12:38:19.333Z", "updatedAt": "2026-10-06T12:38:19.333Z"},
		{"id": "c", "name": "a", "description": "", "projectPath": "/p/a", "createdAt": "2026-10-06T12:40:53.498Z", "updatedAt": "2026-10-06T12:40:53.498Z"},
	}
	svc := NewService(client.NewWithTransport(stubTransport{status: 200, body: envelopeResult(t, rows)}))
	got, err := svc.List()
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if len(got) != len(rows) {
		t.Fatalf("List returned %d workspaces, want %d", len(got), len(rows))
	}
	for i, want := range []string{"a", "b", "c"} {
		if got[i].ID != want {
			t.Fatalf("row %d id = %q, want %q", i, got[i].ID, want)
		}
	}
}

func TestListEmptyStaysEmpty(t *testing.T) {
	svc := NewService(client.NewWithTransport(stubTransport{status: 200, body: envelopeResult(t, []map[string]any{})}))
	got, err := svc.List()
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if len(got) != 0 {
		t.Fatalf("List returned %d workspaces, want 0", len(got))
	}
}

func TestListNoTransportFailsCleanly(t *testing.T) {
	svc := NewService(client.NewWithTransport(nil))
	if _, err := svc.List(); err == nil {
		t.Fatalf("List with nil transport: want error, got nil")
	}
}
