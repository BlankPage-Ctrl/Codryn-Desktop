package mockapi

import (
	"net/http"
)

func (s *Store) handleListCategories(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, r, http.StatusOK, s.Categories.All())
}

func (s *Store) handleCreateCategory(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name  string  `json:"name"`
		Color *string `json:"color"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid body")
		return
	}
	cat := Category{
		ID:        newID(),
		Name:      body.Name,
		Color:     body.Color,
		CreatedAt: ts(),
	}
	s.Categories.Add(cat)
	writeJSON(w, r, http.StatusCreated, cat)
}

func (s *Store) handleRenameCategory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body struct {
		Name string `json:"name"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid body")
		return
	}
	ok := s.Categories.Update(func(c Category) bool { return c.ID == id }, func(c *Category) {
		c.Name = body.Name
	})
	if !ok {
		writeError(w, r, http.StatusBadRequest, "Category "+id+" not found")
		return
	}
	cat, _ := s.Categories.Find(func(c Category) bool { return c.ID == id })
	writeJSON(w, r, http.StatusOK, cat)
}

func (s *Store) handleDeleteCategory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !s.Categories.Remove(func(c Category) bool { return c.ID == id }) {
		writeError(w, r, http.StatusBadRequest, "Category "+id+" not found")
		return
	}
	writeNoContent(w)
}
