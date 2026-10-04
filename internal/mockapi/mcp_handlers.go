package mockapi

import (
	"net/http"
	"sync"
)

// Static MCP stubs so USE_MOCK=true frontends can exercise the MCP panel
// without a real backend. Toggles persist in memory per workspace+server.
var (
	mockMcpMu       sync.Mutex
	mockMcpDisabled = map[string]bool{}
)

func mockMcpServers() []map[string]any {
	return []map[string]any{
		{"name": "default-srv", "transport": "stdio", "tools": 1},
		{"name": "broken-srv", "transport": "http", "tools": 0},
	}
}

func mockMcpEnabled(wsID, name string) bool {
	mockMcpMu.Lock()
	defer mockMcpMu.Unlock()
	return !mockMcpDisabled[wsID+"\x00"+name]
}

func mockMcpSetEnabled(wsID, name string, enabled bool) {
	mockMcpMu.Lock()
	defer mockMcpMu.Unlock()
	mockMcpDisabled[wsID+"\x00"+name] = !enabled
}

func mockMcpState(wsID string, srv map[string]any) map[string]any {
	name := srv["name"].(string)
	enabled := mockMcpEnabled(wsID, name)
	status := "ready"
	errMsg := ""
	if name == "broken-srv" && enabled {
		status = "error"
		errMsg = "mock: connect failed (connection refused)"
	} else if !enabled {
		status = "disabled"
	}
	return map[string]any{
		"name":      name,
		"transport": srv["transport"],
		"enabled":   enabled,
		"status":    status,
		"tools":     srv["tools"],
		"error":     errMsg,
	}
}

func (s *Store) handleMcpList(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("id")
	servers := []map[string]any{}
	for _, srv := range mockMcpServers() {
		servers = append(servers, mockMcpState(wsID, srv))
	}
	writeJSON(w, r, http.StatusOK, map[string]any{
		"workspaceId": wsID,
		"source":      "/mock/.mcp.json",
		"servers":     servers,
	})
}

func (s *Store) handleMcpSet(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("id")
	name := r.PathValue("name")
	var body struct {
		Enabled bool `json:"enabled"`
	}
	if err := readBody(r, &body); err != nil {
		writeJSON(w, r, http.StatusBadRequest, map[string]any{"error": "invalid body"})
		return
	}
	found := false
	for _, srv := range mockMcpServers() {
		if srv["name"] == name {
			found = true
			break
		}
	}
	if !found {
		writeJSON(w, r, http.StatusNotFound, map[string]any{"error": "MCP server not found: " + name})
		return
	}
	mockMcpSetEnabled(wsID, name, body.Enabled)
	var state map[string]any
	for _, srv := range mockMcpServers() {
		if srv["name"] == name {
			state = mockMcpState(wsID, srv)
			break
		}
	}
	writeJSON(w, r, http.StatusOK, map[string]any{"workspaceId": wsID, "server": state})
}
