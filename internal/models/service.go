package models

import "codryn/desktop/internal/client"

type Model struct {
	ID              string  `json:"id"`
	ModelID         string  `json:"modelId"`
	DisplayName     *string `json:"displayName"`
	ProviderID      string  `json:"providerId"`
	MaxInputTokens  *int    `json:"maxInputTokens"`
	MaxOutputTokens *int    `json:"maxOutputTokens"`
	CreatedAt       string  `json:"createdAt"`
	UpdatedAt       string  `json:"updatedAt"`
}

type ModelDto struct {
	ModelID         string  `json:"modelId"`
	DisplayName     *string `json:"displayName,omitempty"`
	MaxInputTokens  *int    `json:"maxInputTokens,omitempty"`
	MaxOutputTokens *int    `json:"maxOutputTokens,omitempty"`
}

type Service struct {
	c *client.Client
}

func NewService(c *client.Client) *Service {
	return &Service{c: c}
}

func (s *Service) List(providerID string) ([]Model, error) {
	return client.DoOK[[]Model](s.c, "GET", "/providers/"+providerID+"/models", nil, nil)
}

func (s *Service) Create(providerID string, dto ModelDto) (Model, error) {
	return client.DoOK[Model](s.c, "POST", "/providers/"+providerID+"/models", dto, nil)
}

func (s *Service) Update(providerID, modelID string, dto map[string]any) (Model, error) {
	return client.DoOK[Model](s.c, "PATCH", "/providers/"+providerID+"/models/"+modelID, dto, nil)
}

func (s *Service) Delete(providerID, modelID string) error {
	return client.DoVoid(s.c, "DELETE", "/providers/"+providerID+"/models/"+modelID, nil)
}
