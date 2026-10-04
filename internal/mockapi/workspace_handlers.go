package mockapi

import (
	"net/http"
)

func (s *Store) handleListWorkspaces(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, r, http.StatusOK, s.Workspaces.All())
}

func (s *Store) handleGetWorkspace(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	ws, ok := s.Workspaces.Find(func(w Workspace) bool { return w.ID == id })
	if !ok {
		writeError(w, r, http.StatusNotFound, "Workspace "+id+" not found")
		return
	}
	writeJSON(w, r, http.StatusOK, ws)
}

func (s *Store) handleCreateWorkspace(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name        string  `json:"name"`
		Description *string `json:"description"`
		ProjectPath string  `json:"projectPath"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid body")
		return
	}
	now := ts()
	ws := Workspace{
		ID:          newID(),
		Name:        body.Name,
		Description: body.Description,
		ProjectPath: body.ProjectPath,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	s.Workspaces.Add(ws)
	writeJSON(w, r, http.StatusCreated, ws)
}

func (s *Store) handleUpdateWorkspace(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := readBody(r, &body); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid body")
		return
	}
	ok := s.Workspaces.Update(func(w Workspace) bool { return w.ID == id }, func(ws *Workspace) {
		if v, ok := body["name"].(string); ok {
			ws.Name = v
		}
		if v, ok := body["description"].(string); ok {
			ws.Description = &v
		}
		if v, ok := body["projectPath"].(string); ok {
			ws.ProjectPath = v
		}
		ws.UpdatedAt = ts()
	})
	if !ok {
		writeError(w, r, http.StatusNotFound, "Workspace "+id+" not found")
		return
	}
	ws, _ := s.Workspaces.Find(func(w Workspace) bool { return w.ID == id })
	writeJSON(w, r, http.StatusOK, ws)
}

func (s *Store) handleDeleteWorkspace(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !s.Workspaces.Remove(func(w Workspace) bool { return w.ID == id }) {
		writeError(w, r, http.StatusNotFound, "Workspace "+id+" not found")
		return
	}
	writeNoContent(w)
}
