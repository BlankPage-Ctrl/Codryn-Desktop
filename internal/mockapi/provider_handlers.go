package mockapi

import (
	"net/http"
)

var mockProviderTypes = []map[string]interface{}{
	{"id": "openai", "label": "OpenAI", "isOfficial": true, "requiresBaseURL": false},
	{"id": "openai-compatible", "label": "OpenAI Compatible", "isOfficial": true, "requiresBaseURL": true},
	{"id": "openrouter", "label": "OpenRouter", "isOfficial": true, "requiresBaseURL": false},
}

func (s *Store) handleListProviderTypes(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, r, http.StatusOK, mockProviderTypes)
}

func (s *Store) handleListProviders(w http.ResponseWriter, r *http.Request) {
	providers := s.Providers.All()
	result := make([]interface{}, len(providers))
	for i, p := range providers {
		result[i] = s.providerWithModels(p)
	}
	writeJSON(w, r, http.StatusOK, result)
}

func (s *Store) handleGetProvider(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	p, ok := s.Providers.Find(func(p Provider) bool { return p.ID == id })
	if !ok {
		writeError(w, r, http.StatusNotFound, "Provider "+id+" not found")
		return
	}
	writeJSON(w, r, http.StatusOK, s.providerWithModels(p))
}

func (s *Store) handleCreateProvider(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name    string  `json:"name"`
		Type    string  `json:"type"`
		APIKey  *string `json:"apiKey"`
		BaseURL *string `json:"baseURL"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid body")
		return
	}
	now := ts()
	p := Provider{
		ID:        newID(),
		Name:      body.Name,
		Type:      body.Type,
		APIKey:    body.APIKey,
		BaseURL:   body.BaseURL,
		CreatedAt: now,
		UpdatedAt: now,
	}
	s.Providers.Add(p)
	writeJSON(w, r, http.StatusCreated, s.providerWithModels(p))
}

func (s *Store) handleUpdateProvider(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := readBody(r, &body); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid body")
		return
	}
	ok := s.Providers.Update(func(p Provider) bool { return p.ID == id }, func(p *Provider) {
		if v, ok := body["name"].(string); ok {
			p.Name = v
		}
		if v, ok := body["type"].(string); ok {
			p.Type = v
		}
		if v, ok := body["apiKey"].(string); ok {
			p.APIKey = &v
		}
		if v, ok := body["baseURL"].(string); ok {
			p.BaseURL = &v
		}
		p.UpdatedAt = ts()
	})
	if !ok {
		writeError(w, r, http.StatusNotFound, "Provider "+id+" not found")
		return
	}
	p, _ := s.Providers.Find(func(p Provider) bool { return p.ID == id })
	writeJSON(w, r, http.StatusOK, s.providerWithModels(p))
}

func (s *Store) handleDeleteProvider(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !s.Providers.Remove(func(p Provider) bool { return p.ID == id }) {
		writeError(w, r, http.StatusNotFound, "Provider "+id+" not found")
		return
	}
	writeNoContent(w)
}

func (s *Store) handleListModels(w http.ResponseWriter, r *http.Request) {
	pvID := r.PathValue("providerId")
	models := s.Models.Filter(func(m ProviderModel) bool { return m.ProviderID == pvID })
	writeJSON(w, r, http.StatusOK, models)
}

func (s *Store) handleCreateModel(w http.ResponseWriter, r *http.Request) {
	pvID := r.PathValue("providerId")
	var body struct {
		ModelID         string  `json:"modelId"`
		DisplayName     *string `json:"displayName"`
		MaxInputTokens  *int    `json:"maxInputTokens"`
		MaxOutputTokens *int    `json:"maxOutputTokens"`
	}
	if err := readBody(r, &body); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid body")
		return
	}
	now := ts()
	m := ProviderModel{
		ID:              newID(),
		ModelID:         body.ModelID,
		DisplayName:     body.DisplayName,
		ProviderID:      pvID,
		MaxInputTokens:  body.MaxInputTokens,
		MaxOutputTokens: body.MaxOutputTokens,
		CreatedAt:       now,
		UpdatedAt:       now,
	}
	s.Models.Add(m)
	writeJSON(w, r, http.StatusCreated, m)
}

func toOptionalInt(v interface{}) (*int, bool) {
	if v == nil {
		return nil, true
	}
	switch n := v.(type) {
	case float64:
		if n <= 0 {
			return nil, true
		}
		i := int(n)
		return &i, true
	default:
		return nil, false
	}
}

func (s *Store) handleUpdateModel(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var body map[string]interface{}
	if err := readBody(r, &body); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid body")
		return
	}
	ok := s.Models.Update(func(m ProviderModel) bool { return m.ID == id }, func(m *ProviderModel) {
		if v, ok := body["modelId"].(string); ok {
			m.ModelID = v
		}
		if v, ok := body["displayName"].(string); ok {
			m.DisplayName = &v
		}
		if raw, present := body["maxInputTokens"]; present {
			if v, ok := toOptionalInt(raw); ok {
				m.MaxInputTokens = v
			}
		}
		if raw, present := body["maxOutputTokens"]; present {
			if v, ok := toOptionalInt(raw); ok {
				m.MaxOutputTokens = v
			}
		}
		m.UpdatedAt = ts()
	})
	if !ok {
		writeError(w, r, http.StatusNotFound, "Model "+id+" not found")
		return
	}
	md, _ := s.Models.Find(func(m ProviderModel) bool { return m.ID == id })
	writeJSON(w, r, http.StatusOK, md)
}

func (s *Store) handleDeleteModel(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !s.Models.Remove(func(m ProviderModel) bool { return m.ID == id }) {
		writeError(w, r, http.StatusNotFound, "Model "+id+" not found")
		return
	}
	writeNoContent(w)
}
