package chats

import "codryn/desktop/internal/client"

type Chat struct {
	ID           string  `json:"id"`
	Title        string  `json:"title"`
	ProviderID   *string `json:"providerId"`
	ModelID      *string `json:"modelId"`
	SystemPrompt *string `json:"systemPrompt"`
	ThinkingMode string  `json:"thinkingMode"`
	Mode         string  `json:"mode"`
	WorkspaceID  string  `json:"workspaceId"`
	CreatedAt    string  `json:"createdAt"`
	UpdatedAt    string  `json:"updatedAt"`
}

type ChatDto struct {
	Title        *string `json:"title,omitempty"`
	ModelID      *string `json:"modelId,omitempty"`
	ProviderID   *string `json:"providerId,omitempty"`
	SystemPrompt *string `json:"systemPrompt,omitempty"`
	ThinkingMode *string `json:"thinkingMode,omitempty"`
	Mode         *string `json:"mode,omitempty"`
}

type Service struct {
	c *client.Client
}

func NewService(c *client.Client) *Service {
	return &Service{c: c}
}

func (s *Service) List(workspaceID string) ([]Chat, error) {
	return client.DoOK[[]Chat](s.c, "GET", "/workspaces/"+workspaceID+"/chats", nil, nil)
}

func (s *Service) Get(workspaceID, chatID string) (Chat, error) {
	return client.DoOK[Chat](s.c, "GET", "/workspaces/"+workspaceID+"/chats/"+chatID, nil, nil)
}

type ChatTitleDto struct {
	Text       string  `json:"text"`
	ProviderID *string `json:"providerId,omitempty"`
	ModelID    *string `json:"modelId,omitempty"`
}

func (s *Service) Create(workspaceID string, dto ChatDto) (Chat, error) {
	return client.DoOK[Chat](s.c, "POST", "/workspaces/"+workspaceID+"/chats", dto, nil)
}

func (s *Service) GenerateTitle(workspaceID, chatID string, dto ChatTitleDto) (Chat, error) {
	return client.DoOK[Chat](s.c, "POST", "/workspaces/"+workspaceID+"/chats/"+chatID+"/title", dto, nil)
}

func (s *Service) Update(workspaceID, chatID string, dto map[string]any) (Chat, error) {
	return client.DoOK[Chat](s.c, "PATCH", "/workspaces/"+workspaceID+"/chats/"+chatID, dto, nil)
}

func (s *Service) Delete(workspaceID, chatID string) error {
	return client.DoVoid(s.c, "DELETE", "/workspaces/"+workspaceID+"/chats/"+chatID, nil)
}
