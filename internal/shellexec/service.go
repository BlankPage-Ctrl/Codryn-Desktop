package shellexec

import "codryn/desktop/internal/client"

// KillResult mirrors the backend ShellKillResult JSON shape returned by
// DELETE /shell/executions/:executionId.
type KillResult struct {
	ExecutionID string `json:"executionId"`
	Killed      bool   `json:"killed"`
}

// Service talks to the backend shell execution endpoints over the shared
// client transport.
type Service struct {
	c *client.Client
}

func NewService(c *client.Client) *Service {
	return &Service{c: c}
}

// KillExecution best-effort stops one live shell run by execution id.
// Unknown or already-finished ids resolve with Killed=false, not an error.
func (s *Service) KillExecution(executionId string) (KillResult, error) {
	return client.DoOK[KillResult](s.c, "DELETE", "/shell/executions/"+executionId, nil, nil)
}
