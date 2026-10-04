package mockapi

import (
	"fmt"
	"net/http"
)

func (s *Store) handleListDir(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	if path == "" {
		path = "."
	}
	nodes := s.listDirNodes(path)
	if nodes == nil {
		writeError(w, r, http.StatusNotFound, "Path not found: "+path)
		return
	}
	writeJSON(w, r, http.StatusOK, ListDirData{RequestedPath: path, Nodes: nodes})
}

func (s *Store) handleGetStat(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	if path == "" {
		path = "."
	}
	node := s.statNode(path)
	if node == nil {
		writeError(w, r, http.StatusNotFound, "Path not found: "+path)
		return
	}
	writeJSON(w, r, http.StatusOK, GetStatData{Node: *node})
}

func (s *Store) handleReadFile(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	maxBytes := 100000
	if s := r.URL.Query().Get("maxBytes"); s != "" {
		var n int
		if _, err := fmt.Sscanf(s, "%d", &n); err == nil {
			maxBytes = n
		}
	}
	data := s.readFileContent(path, maxBytes)
	if data == nil {
		writeError(w, r, http.StatusNotFound, "Path not found: "+path)
		return
	}
	writeJSON(w, r, http.StatusOK, data)
}

func (s *Store) handleSearchFiles(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	if query == "" {
		writeJSON(w, r, http.StatusOK, SearchFilesData{Query: query, Matches: []FileNode{}})
		return
	}

	maxResults := 50
	if s := r.URL.Query().Get("maxResults"); s != "" {
		var n int
		if _, err := fmt.Sscanf(s, "%d", &n); err == nil && n > 0 {
			maxResults = n
		}
	}
	maxDepth := 12
	if s := r.URL.Query().Get("maxDepth"); s != "" {
		var n int
		if _, err := fmt.Sscanf(s, "%d", &n); err == nil {
			maxDepth = n
		}
	}

	writeJSON(w, r, http.StatusOK, SearchFilesData{
		Query:   query,
		Matches: s.searchFileTree(query, maxResults, maxDepth),
	})
}

func (s *Store) handleFileEvents(w http.ResponseWriter, r *http.Request) {
	streamFileEventsSSE(w, r, s.FileTree)
}
