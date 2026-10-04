package mockapi

import (
	"fmt"
	"net/http"
	"strings"
)

func (s *Store) handleListNotes(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	notes := s.Notes.All()

	if cat := q.Get("category"); cat != "" {
		notes = s.Notes.Filter(func(n Note) bool { return n.CategoryID == cat })
	}
	if pri := q.Get("priority"); pri != "" {
		notes = s.Notes.Filter(func(n Note) bool { return n.Priority == pri })
	}
	if search := q.Get("search"); search != "" {
		search = strings.ToLower(search)
		var filtered []Note
		for _, n := range notes {
			if strings.Contains(strings.ToLower(n.Name), search) ||
				strings.Contains(strings.ToLower(n.Desc), search) ||
				strings.Contains(strings.ToLower(n.Details), search) {
				filtered = append(filtered, n)
			}
		}
		notes = filtered
	}

	switch q.Get("sort") {
	case "name":
		for i := 0; i < len(notes); i++ {
			for j := i + 1; j < len(notes); j++ {
				if notes[i].Name > notes[j].Name {
					notes[i], notes[j] = notes[j], notes[i]
				}
			}
		}
	case "priority":
		order := map[string]int{"critical": 0, "high": 1, "medium": 2, "low": 3}
		for i := 0; i < len(notes); i++ {
			for j := i + 1; j < len(notes); j++ {
				if order[notes[i].Priority] > order[notes[j].Priority] {
					notes[i], notes[j] = notes[j], notes[i]
				}
			}
		}
	default:
		for i := 0; i < len(notes); i++ {
			for j := i + 1; j < len(notes); j++ {
				if notes[i].Rank > notes[j].Rank {
					notes[i], notes[j] = notes[j], notes[i]
				}
			}
		}
	}

	if q.Get("order") == "desc" {
		for i, j := 0, len(notes)-1; i < j; i, j = i+1, j-1 {
			notes[i], notes[j] = notes[j], notes[i]
		}
	}

	offset := 0
	if o := q.Get("offset"); o != "" {
		var n int
		if _, err := fmt.Sscanf(o, "%d", &n); err == nil {
			offset = n
		}
	}
	limit := len(notes)
	if l := q.Get("limit"); l != "" {
		var n int
		if _, err := fmt.Sscanf(l, "%d", &n); err == nil && n > 0 {
			limit = offset + n
			if limit > len(notes) {
				limit = len(notes)
			}
		}
	}
	if offset > len(notes) {
		offset = len(notes)
	}

	writeJSON(w, r, http.StatusOK, notes[offset:limit])
}

func (s *Store) handleGetNote(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	note, ok := s.Notes.Find(func(n Note) bool { return n.ID == id })
	if !ok {
		writeError(w, r, http.StatusNotFound, "Note "+id+" not found")
		return
	}
	writeJSON(w, r, http.StatusOK, note)
}

func (s *Store) handleCreateNote(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name       string  `json:"name"`
		CategoryID *string `json:"category_id"`
		Desc       *string `json:"desc"`
		Details    *string `json:"details"`
		Priority   *string `json:"priority"`
		Position   struct {
			Before *string `json:"before"`
			After  *string `json:"after"`
		} `json:"position"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid body")
		return
	}
	now := ts()
	note := Note{
		ID:        newID(),
		Name:      body.Name,
		Rank:      s.nextNoteRank(),
		Priority:  "medium",
		CreatedAt: now,
		UpdatedAt: now,
		Version:   1,
	}
	if body.CategoryID != nil {
		note.CategoryID = *body.CategoryID
	}
	if body.Desc != nil {
		note.Desc = *body.Desc
	}
	if body.Details != nil {
		note.Details = *body.Details
	}
	if body.Priority != nil {
		note.Priority = *body.Priority
	}
	if body.Position.Before != nil {
		if before, ok := s.Notes.Find(func(n Note) bool { return n.ID == *body.Position.Before }); ok {
			note.Rank = before.Rank
		}
	} else if body.Position.After != nil {
		if after, ok := s.Notes.Find(func(n Note) bool { return n.ID == *body.Position.After }); ok {
			note.Rank = after.Rank + "_" + s.nextNoteRank()
		}
	}
	s.Notes.Add(note)
	writeJSON(w, r, http.StatusCreated, note)
}

func (s *Store) handleUpdateNote(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := readBody(r, &body); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid body")
		return
	}
	ok := s.Notes.Update(func(n Note) bool { return n.ID == id }, func(n *Note) {
		if v, ok := body["name"].(string); ok {
			n.Name = v
		}
		if v, ok := body["category_id"].(string); ok {
			n.CategoryID = v
		}
		if v, ok := body["desc"].(string); ok {
			n.Desc = v
		}
		if v, ok := body["details"].(string); ok {
			n.Details = v
		}
		if v, ok := body["priority"].(string); ok {
			n.Priority = v
		}
		n.Version++
		n.UpdatedAt = ts()
	})
	if !ok {
		writeError(w, r, http.StatusBadRequest, "Note "+id+" not found")
		return
	}
	note, _ := s.Notes.Find(func(n Note) bool { return n.ID == id })
	writeJSON(w, r, http.StatusOK, note)
}

func (s *Store) handleDeleteNote(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	s.Notes.Remove(func(n Note) bool { return n.ID == id })
	writeNoContent(w)
}

func (s *Store) handleMoveNote(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body struct {
		Before *string `json:"before"`
		After  *string `json:"after"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid body")
		return
	}
	ok := s.Notes.Update(func(n Note) bool { return n.ID == id }, func(n *Note) {
		if body.Before != nil {
			if before, ok := s.Notes.Find(func(x Note) bool { return x.ID == *body.Before }); ok {
				n.Rank = before.Rank + "_before"
			}
		} else if body.After != nil {
			if after, ok := s.Notes.Find(func(x Note) bool { return x.ID == *body.After }); ok {
				n.Rank = after.Rank + "_after"
			}
		}
		n.UpdatedAt = ts()
	})
	if !ok {
		writeError(w, r, http.StatusBadRequest, "Note "+id+" not found")
		return
	}
	note, _ := s.Notes.Find(func(n Note) bool { return n.ID == id })
	writeJSON(w, r, http.StatusOK, note)
}

func (s *Store) handleRenumberNotes(w http.ResponseWriter, r *http.Request) {
	notes := s.Notes.All()
	for i, n := range notes {
		s.Notes.Update(func(x Note) bool { return x.ID == n.ID }, func(x *Note) {
			x.Rank = fmt.Sprintf("%d", i)
		})
	}
	writeJSON(w, r, http.StatusOK, map[string]bool{"ok": true})
}
