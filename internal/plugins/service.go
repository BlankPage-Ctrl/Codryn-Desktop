package plugins

import (
	"codryn/desktop/internal/client"
)

// PluginStatus mirrors PluginStatus in Codryn/apps/plugins/types.ts.
type PluginStatus string

const (
	PluginReady        PluginStatus = "ready"
	PluginNotInstalled PluginStatus = "not-installed"
	PluginError        PluginStatus = "error"
	PluginDisabled     PluginStatus = "disabled"
)

// PluginCaps mirrors PluginCaps in Codryn/apps/plugins/types.ts.
type PluginCaps struct {
	Format      string   `json:"format"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Version     *string  `json:"version"`
	Skills      []string `json:"skills"`
	Permissions struct {
		Shell     bool `json:"shell"`
		Network   bool `json:"network"`
		Sensitive bool `json:"sensitive"`
	} `json:"permissions"`
	Bootstrap string         `json:"bootstrap"`
	Tools     []map[string]any `json:"tools"`
	Notices   []string       `json:"notices"`
}

// PluginState mirrors PluginState in Codryn/apps/plugins/types.ts.
type PluginState struct {
	ID      string       `json:"id"`
	Path    *string      `json:"path"`
	Source  string       `json:"source"`
	Enabled bool         `json:"enabled"`
	Status  PluginStatus `json:"status"`
	Error   *string      `json:"error"`
	Caps    *PluginCaps  `json:"caps"`
}

// DiscoveredPlugin mirrors DiscoveredPlugin in Codryn/apps/plugins/types.ts.
type DiscoveredPlugin struct {
	ID            string   `json:"id"`
	Dir           string   `json:"dir"`
	Registered    bool     `json:"registered"`
	Enabled       bool     `json:"enabled"`
	ManifestValid bool     `json:"manifestValid"`
	Notices       []string `json:"notices"`
}

type ListResult struct {
	WorkspaceID string        `json:"workspaceId"`
	Plugins     []PluginState `json:"plugins"`
}

type GetResult struct {
	WorkspaceID string      `json:"workspaceId"`
	Plugin      PluginState `json:"plugin"`
}

type SetResult struct {
	WorkspaceID string      `json:"workspaceId"`
	Plugin      PluginState `json:"plugin"`
}

type DiscoverResult struct {
	Plugins []DiscoveredPlugin `json:"plugins"`
}

type RegisterResult struct {
	PluginID string `json:"pluginId"`
	Enabled  bool   `json:"enabled"`
}

type UnregisterResult struct {
	PluginID     string `json:"pluginId"`
	Unregistered bool   `json:"unregistered"`
}

// Service talks to the backend plugin endpoints over the shared client
// transport (HTTP and STDIO both work - see stdioRoutes in client/stdio.go).
// Toggles are per workspace: enabling plugin A in workspace X does not
// affect workspace Y.
type Service struct {
	c *client.Client
}

func NewService(c *client.Client) *Service {
	return &Service{c: c}
}

func (s *Service) List(workspaceID string) (ListResult, error) {
	return client.DoOK[ListResult](s.c, "GET", "/workspaces/"+workspaceID+"/plugins", nil, nil)
}

func (s *Service) Get(workspaceID, id string) (GetResult, error) {
	return client.DoOK[GetResult](s.c, "GET", "/workspaces/"+workspaceID+"/plugins/"+id, nil, nil)
}

// SetEnabled persists the per-workspace on/off intent and returns the fresh
// plugin state for that workspace.
func (s *Service) SetEnabled(workspaceID, id string, enabled bool) (SetResult, error) {
	return client.DoOK[SetResult](
		s.c, "PUT",
		"/workspaces/"+workspaceID+"/plugins/"+id,
		map[string]any{"enabled": enabled}, nil,
	)
}

func (s *Service) Discover() (DiscoverResult, error) {
	return client.DoOK[DiscoverResult](s.c, "POST", "/plugins/discover", map[string]any{}, nil)
}

func (s *Service) Register(pluginID string, pluginDir string) (RegisterResult, error) {
	body := map[string]any{"pluginId": pluginID}
	if pluginDir != "" {
		body["pluginDir"] = pluginDir
	}
	return client.DoOK[RegisterResult](s.c, "POST", "/plugins/register", body, nil)
}

func (s *Service) Unregister(pluginID string) (UnregisterResult, error) {
	return client.DoOK[UnregisterResult](s.c, "DELETE", "/plugins/"+pluginID, nil, nil)
}
