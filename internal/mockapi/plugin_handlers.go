package mockapi

import (
	"net/http"
	"sync"
)

// Static plugin stubs so USE_MOCK=true frontends can exercise the plugin
// wiring without a real backend. Toggles persist in memory per workspace.
var (
	mockPluginMu       sync.Mutex
	mockPluginDisabled = map[string]bool{}
)

func mockPlugins() []map[string]any {
	return []map[string]any{
		{"id": "plugin-a", "source": "local"},
		{"id": "plugin-b", "source": "local"},
		{"id": "plugin-c", "source": "local"},
	}
}

func mockPluginEnabled(wsID, id string) bool {
	mockPluginMu.Lock()
	defer mockPluginMu.Unlock()
	return !mockPluginDisabled[wsID+"\x00"+id]
}

func mockPluginSetEnabled(wsID, id string, enabled bool) {
	mockPluginMu.Lock()
	defer mockPluginMu.Unlock()
	mockPluginDisabled[wsID+"\x00"+id] = !enabled
}

func mockPluginState(wsID string, p map[string]any) map[string]any {
	id := p["id"].(string)
	enabled := mockPluginEnabled(wsID, id)
	status := "ready"
	if !enabled {
		status = "disabled"
	}
	return map[string]any{
		"id":      id,
		"path":    nil,
		"source":  p["source"],
		"enabled": enabled,
		"status":  status,
		"error":   nil,
		"caps": map[string]any{
			"format":      "bare",
			"name":        id,
			"description": "mock plugin " + id,
			"version":     nil,
			"skills":      []string{},
			"permissions": map[string]any{"shell": false, "network": false, "sensitive": false},
			"bootstrap":   nil,
			"tools":       []any{},
			"notices":     []string{},
		},
	}
}

func (s *Store) handlePluginList(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("id")
	plugins := []map[string]any{}
	for _, p := range mockPlugins() {
		plugins = append(plugins, mockPluginState(wsID, p))
	}
	writeJSON(w, r, http.StatusOK, map[string]any{
		"workspaceId": wsID,
		"plugins":     plugins,
	})
}

func (s *Store) handlePluginGet(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("id")
	pluginID := r.PathValue("pluginId")
	for _, p := range mockPlugins() {
		if p["id"] == pluginID {
			writeJSON(w, r, http.StatusOK, map[string]any{
				"workspaceId": wsID,
				"plugin":      mockPluginState(wsID, p),
			})
			return
		}
	}
	writeJSON(w, r, http.StatusNotFound, map[string]any{"error": "Plugin not found: " + pluginID})
}

func (s *Store) handlePluginSet(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("id")
	pluginID := r.PathValue("pluginId")
	var body struct {
		Enabled bool `json:"enabled"`
	}
	if err := readBody(r, &body); err != nil {
		writeJSON(w, r, http.StatusBadRequest, map[string]any{"error": "invalid body"})
		return
	}
	found := false
	for _, p := range mockPlugins() {
		if p["id"] == pluginID {
			found = true
			break
		}
	}
	if !found {
		writeJSON(w, r, http.StatusNotFound, map[string]any{"error": "Plugin not found: " + pluginID})
		return
	}
	mockPluginSetEnabled(wsID, pluginID, body.Enabled)
	for _, p := range mockPlugins() {
		if p["id"] == pluginID {
			writeJSON(w, r, http.StatusOK, map[string]any{
				"workspaceId": wsID,
				"plugin":      mockPluginState(wsID, p),
			})
			return
		}
	}
}

func (s *Store) handlePluginDiscover(w http.ResponseWriter, r *http.Request) {
	discovered := []map[string]any{}
	for _, p := range mockPlugins() {
		discovered = append(discovered, map[string]any{
			"id":            p["id"],
			"dir":           "/mock/plugins/" + p["id"].(string),
			"registered":    true,
			"enabled":       true,
			"manifestValid": true,
			"notices":       []string{},
		})
	}
	writeJSON(w, r, http.StatusOK, map[string]any{"plugins": discovered})
}

func (s *Store) handlePluginRegister(w http.ResponseWriter, r *http.Request) {
	var body struct {
		PluginID  string `json:"pluginId"`
		PluginDir string `json:"pluginDir"`
	}
	if err := readBody(r, &body); err != nil || body.PluginID == "" {
		writeJSON(w, r, http.StatusBadRequest, map[string]any{"error": "invalid body"})
		return
	}
	writeJSON(w, r, http.StatusOK, map[string]any{"pluginId": body.PluginID, "enabled": true})
}

func (s *Store) handlePluginUnregister(w http.ResponseWriter, r *http.Request) {
	pluginID := r.PathValue("pluginId")
	writeJSON(w, r, http.StatusOK, map[string]any{"pluginId": pluginID, "unregistered": true})
}
