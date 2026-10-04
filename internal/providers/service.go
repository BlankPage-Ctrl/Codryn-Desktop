package providers

import "codryn/desktop/internal/client"

type ProviderModel struct {
	ID              string  `json:"id"`
	ModelID         string  `json:"modelId"`
	DisplayName     *string `json:"displayName"`
	ProviderID      string  `json:"providerId"`
	MaxInputTokens  *int    `json:"maxInputTokens"`
	MaxOutputTokens *int    `json:"maxOutputTokens"`
	CreatedAt       string  `json:"createdAt"`
	UpdatedAt       string  `json:"updatedAt"`
}

type Provider struct {
	ID        string          `json:"id"`
	Name      string          `json:"name"`
	Type      string          `json:"type"`
	APIKey    *string         `json:"apiKey"`
	BaseURL   *string         `json:"baseURL"`
	Models    []ProviderModel `json:"models"`
	CreatedAt string          `json:"createdAt"`
	UpdatedAt string          `json:"updatedAt"`
}

type ProviderDto struct {
	Name    string  `json:"name"`
	Type    string  `json:"type"`
	APIKey  *string `json:"apiKey,omitempty"`
	BaseURL *string `json:"baseURL,omitempty"`
}

type ProviderType struct {
	ID              string `json:"id"`
	Label           string `json:"label"`
	IsOfficial      bool   `json:"isOfficial"`
	RequiresBaseURL bool   `json:"requiresBaseURL"`
}

type Service struct {
	c *client.Client
}

func NewService(c *client.Client) *Service {
	return &Service{c: c}
}

func (s *Service) List() ([]Provider, error) {
	return client.DoOK[[]Provider](s.c, "GET", "/providers", nil, nil)
}

func (s *Service) ListTypes() ([]ProviderType, error) {
	return client.DoOK[[]ProviderType](s.c, "GET", "/providers/types", nil, nil)
}

func (s *Service) Get(id string) (Provider, error) {
	return client.DoOK[Provider](s.c, "GET", "/providers/"+id, nil, nil)
}

func (s *Service) Create(dto ProviderDto) (Provider, error) {
	return client.DoOK[Provider](s.c, "POST", "/providers", dto, nil)
}

func (s *Service) Update(id string, dto map[string]any) (Provider, error) {
	return client.DoOK[Provider](s.c, "PATCH", "/providers/"+id, dto, nil)
}

func (s *Service) Delete(id string) error {
	return client.DoVoid(s.c, "DELETE", "/providers/"+id, nil)
}
