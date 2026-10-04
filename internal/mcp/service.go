package mcp

import (
	"net/url"

	"codryn/desktop/internal/client"
)

// ServerState mirrors McpServerState in apps/mcp/manager.ts.
type ServerState struct {
	Name      string `json:"name"`
	Transport string `json:"transport"`
	Enabled   bool   `json:"enabled"`
	Status    string `json:"status"`
	Tools     int    `json:"tools"`
	Error     string `json:"error"`
}

type ListResult struct {
	WorkspaceID string        `json:"workspaceId"`
	Source      string        `json:"source"`
	Servers     []ServerState `json:"servers"`
}

type SetResult struct {
	WorkspaceID string      `json:"workspaceId"`
	Server      ServerState `json:"server"`
}

// Service talks to the backend MCP endpoints over the shared client
// transport (HTTP and STDIO both work - see stdioRoutes in client/stdio.go).
type Service struct {
	c *client.Client
}

func NewService(c *client.Client) *Service {
	return &Service{c: c}
}

func (s *Service) ListServers(workspaceID string) (ListResult, error) {
	return client.DoOK[ListResult](s.c, "GET", "/workspaces/"+workspaceID+"/mcp/servers", nil, nil)
}

// SetEnabled persists the on/off intent and returns the fresh server state.
// Enabling a previously-errored server reconnects it, so On doubles as retry.
//
// NOTE: the name is PathEscape-d for the HTTP transport. The STDIO transport
// matches the escaped path literally, so exotic names (spaces, slashes) only
// round-trip over HTTP; de-facto names are [a-z0-9_-] and work everywhere.
func (s *Service) SetEnabled(workspaceID, name string, enabled bool) (SetResult, error) {
	return client.DoOK[SetResult](
		s.c, "PUT",
		"/workspaces/"+workspaceID+"/mcp/servers/"+url.PathEscape(name),
		map[string]any{"enabled": enabled}, nil,
	)
}
