package mockapi

import (
	"net/http"
)

// Static insight stubs so USE_MOCK=true frontends can exercise the
// insight actions without a real srcinsight binary.
func (s *Store) handleInsightEnsure(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("id")
	writeJSON(w, r, http.StatusOK, map[string]any{
		"workspaceId": wsID,
		"enabled":     false,
		"running":     false,
		"projectPath": "/mock",
	})
}

func (s *Store) handleInsightStatus(w http.ResponseWriter, r *http.Request) {
	s.handleInsightEnsure(w, r)
}

func (s *Store) handleInsightStop(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("id")
	writeJSON(w, r, http.StatusOK, map[string]any{"workspaceId": wsID, "stopped": true})
}

func (s *Store) handleInsightSync(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, r, http.StatusOK, map[string]any{
		"filesChecked": 0,
		"added":        0,
		"modified":     0,
		"removed":      0,
	})
}

func (s *Store) handleInsightIndex(w http.ResponseWriter, r *http.Request) {
	s.handleInsightSync(w, r)
}

func (s *Store) handleInsightIndexStatus(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, r, http.StatusOK, map[string]any{
		"syncing":      false,
		"pending":      0,
		"requiresFull": false,
	})
}

func (s *Store) handleInsightSearch(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("query")
	writeJSON(w, r, http.StatusOK, map[string]any{
		"query": q,
		"hits":  []any{},
		"stats": map[string]any{"filesScanned": 0, "functionsIndexed": 0, "nodesReturned": 0},
	})
}
