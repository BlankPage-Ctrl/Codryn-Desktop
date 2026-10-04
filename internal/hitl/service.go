package hitl

import (
	"encoding/json"
	"time"

	"codryn/desktop/internal/client"
)

// HitlRequest mirrors the HITL request JSON returned by the backend. The
// polymorphic payload/response are kept as raw JSON because their shape depends
// on the request type (approval/ask/choice).
type HitlRequest struct {
	ID            string          `json:"id"`
	Type          string          `json:"type"`
	Title         string          `json:"title"`
	Description   *string         `json:"description"`
	CorrelationID *string         `json:"correlationId"`
	WorkspaceID   *string         `json:"workspaceId"`
	ChatID        *string         `json:"chatId"`
	ExecutionID   *string         `json:"executionId"`
	Metadata      map[string]any  `json:"metadata"`
	Status        string          `json:"status"`
	CreatedAt     time.Time       `json:"createdAt"`
	UpdatedAt     time.Time       `json:"updatedAt"`
	ExpiresAt     *time.Time      `json:"expiresAt"`
	ResolvedAt    *time.Time      `json:"resolvedAt"`
	Payload       json.RawMessage `json:"payload"`
	Response      json.RawMessage `json:"response"`
}

type CancelResult struct {
	Cancelled bool `json:"cancelled"`
}

// Service talks to the backend HITL endpoints over the shared client transport.
type Service struct {
	c *client.Client
}

func NewService(c *client.Client) *Service {
	return &Service{c: c}
}

func (s *Service) ListPending() ([]HitlRequest, error) {
	return client.DoOK[[]HitlRequest](s.c, "GET", "/hitl/requests/pending", nil, nil)
}

func (s *Service) GetByID(id string) (HitlRequest, error) {
	return client.DoOK[HitlRequest](s.c, "GET", "/hitl/requests/"+id, nil, nil)
}

func (s *Service) Create(input map[string]any) (HitlRequest, error) {
	return client.DoOK[HitlRequest](s.c, "POST", "/hitl/requests", input, nil)
}

func (s *Service) SubmitResponse(id string, response map[string]any) (HitlRequest, error) {
	return client.DoOK[HitlRequest](s.c, "POST", "/hitl/requests/"+id+"/response", response, nil)
}

func (s *Service) Cancel(id string) error {
	return client.DoVoid(s.c, "POST", "/hitl/requests/"+id+"/cancel", nil)
}
