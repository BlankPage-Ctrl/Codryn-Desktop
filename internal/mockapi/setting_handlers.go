package mockapi

import (
	"net/http"
)

func (s *Store) handleGetSetting(w http.ResponseWriter, r *http.Request) {
	key := r.PathValue("key")
	val, _ := s.Settings[key]
	var v *string
	if val != "" {
		v = &val
	}
	writeJSON(w, r, http.StatusOK, SettingValue{Key: key, Value: v})
}

func (s *Store) handleSetSetting(w http.ResponseWriter, r *http.Request) {
	key := r.PathValue("key")
	var body struct {
		Value string `json:"value"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid body")
		return
	}
	s.Settings[key] = body.Value
	writeJSON(w, r, http.StatusOK, SettingValue{Key: key, Value: &body.Value})
}
