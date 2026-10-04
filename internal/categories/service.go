package categories

import "codryn/desktop/internal/client"

type Category struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Color     *string `json:"color"`
	IsDefault bool    `json:"is_default"`
	CreatedAt string  `json:"created_at"`
}

type CategoryDto struct {
	Name  string  `json:"name"`
	Color *string `json:"color,omitempty"`
}

type Service struct {
	c *client.Client
}

func NewService(c *client.Client) *Service {
	return &Service{c: c}
}

func (s *Service) List(workspaceID string) ([]Category, error) {
	return client.DoOK[[]Category](s.c, "GET", "/workspaces/"+workspaceID+"/categories", nil, nil)
}

func (s *Service) Create(workspaceID string, dto CategoryDto) (Category, error) {
	return client.DoOK[Category](s.c, "POST", "/workspaces/"+workspaceID+"/categories", dto, nil)
}

func (s *Service) Rename(workspaceID, id, name string) (Category, error) {
	return client.DoOK[Category](s.c, "PATCH", "/workspaces/"+workspaceID+"/categories/"+id, map[string]string{"name": name}, nil)
}

func (s *Service) Delete(workspaceID, id string) error {
	return client.DoVoid(s.c, "DELETE", "/workspaces/"+workspaceID+"/categories/"+id, nil)
}
