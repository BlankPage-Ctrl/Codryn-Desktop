package notes

import (
	"strconv"

	"codryn/desktop/internal/client"
)

type Note struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	CategoryID string `json:"category_id"`
	Desc       string `json:"desc"`
	Details    string `json:"details"`
	Rank       string `json:"rank"`
	Priority   string `json:"priority"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at"`
	Version    int    `json:"version"`
}

type NoteDto struct {
	Name       string  `json:"name"`
	CategoryID *string `json:"category_id,omitempty"`
	Desc       *string `json:"desc,omitempty"`
	Details    *string `json:"details,omitempty"`
	Priority   *string `json:"priority,omitempty"`
}

type MovePosition struct {
	Before *string `json:"before,omitempty"`
	After  *string `json:"after,omitempty"`
}

type Service struct {
	c *client.Client
}

func NewService(c *client.Client) *Service {
	return &Service{c: c}
}

func (s *Service) List(workspaceID string, filter map[string]any) ([]Note, error) {
	q := map[string]string{}
	for k, v := range filter {
		if str, ok := v.(string); ok {
			q[k] = str
		}
		if num, ok := v.(float64); ok {
			q[k] = strconv.FormatFloat(num, 'f', 0, 64)
		}
	}
	return client.DoOK[[]Note](s.c, "GET", "/workspaces/"+workspaceID+"/notes", nil, q)
}

func (s *Service) Get(workspaceID, id string) (Note, error) {
	return client.DoOK[Note](s.c, "GET", "/workspaces/"+workspaceID+"/notes/"+id, nil, nil)
}

func (s *Service) Create(workspaceID string, dto NoteDto) (Note, error) {
	return client.DoOK[Note](s.c, "POST", "/workspaces/"+workspaceID+"/notes", dto, nil)
}

func (s *Service) Update(workspaceID, id string, dto map[string]any) (Note, error) {
	return client.DoOK[Note](s.c, "PATCH", "/workspaces/"+workspaceID+"/notes/"+id, dto, nil)
}

func (s *Service) Delete(workspaceID, id string) error {
	return client.DoVoid(s.c, "DELETE", "/workspaces/"+workspaceID+"/notes/"+id, nil)
}

func (s *Service) Move(workspaceID, id string, pos MovePosition) (Note, error) {
	return client.DoOK[Note](s.c, "POST", "/workspaces/"+workspaceID+"/notes/"+id+"/move", pos, nil)
}

func (s *Service) Renumber(workspaceID string) (map[string]bool, error) {
	return client.DoOK[map[string]bool](s.c, "POST", "/workspaces/"+workspaceID+"/notes-renumber", nil, nil)
}
