package workspaces

import "codryn/desktop/internal/client"

type Workspace struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description *string `json:"description"`
	ProjectPath string  `json:"projectPath"`
	CreatedAt   string  `json:"createdAt"`
	UpdatedAt   string  `json:"updatedAt"`
}

type WorkspaceDto struct {
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
	ProjectPath string  `json:"projectPath"`
}

type Service struct {
	c *client.Client
}

func NewService(c *client.Client) *Service {
	return &Service{c: c}
}

func (s *Service) List() ([]Workspace, error) {
	return client.DoOK[[]Workspace](s.c, "GET", "/workspaces", nil, nil)
}

func (s *Service) Get(id string) (Workspace, error) {
	return client.DoOK[Workspace](s.c, "GET", "/workspaces/"+id, nil, nil)
}

func (s *Service) Create(dto WorkspaceDto) (Workspace, error) {
	return client.DoOK[Workspace](s.c, "POST", "/workspaces", dto, nil)
}

func (s *Service) Update(id string, dto map[string]any) (Workspace, error) {
	return client.DoOK[Workspace](s.c, "PATCH", "/workspaces/"+id, dto, nil)
}

func (s *Service) Delete(id string) error {
	return client.DoVoid(s.c, "DELETE", "/workspaces/"+id, nil)
}
