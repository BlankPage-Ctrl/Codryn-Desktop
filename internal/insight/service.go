package insight

import (
	"strconv"
	"strings"

	"codryn/desktop/internal/client"
	"codryn/desktop/internal/settings"
)

type SyncResult struct {
	FilesChecked int `json:"filesChecked"`
	Added        int `json:"added"`
	Modified     int `json:"modified"`
	Removed      int `json:"removed"`
}

type IndexStatus struct {
	Syncing      bool `json:"syncing"`
	Pending      int  `json:"pending"`
	RequiresFull bool `json:"requiresFull"`
}

type SearchHit struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Kind      string `json:"kind"`
	FilePath  string `json:"filePath"`
	LineRange struct {
		Start int `json:"start"`
		End   int `json:"end"`
	} `json:"lineRange"`
}

type SearchResult struct {
	Query string         `json:"query"`
	Hits  []SearchHit    `json:"hits"`
	Stats map[string]any `json:"stats"`
}

type Status struct {
	WorkspaceID string `json:"workspaceId"`
	Enabled     bool   `json:"enabled"`
	Running     bool   `json:"running"`
	ProjectPath string `json:"projectPath"`
}

type SearchParams struct {
	Query     string `json:"query"`
	Mode      string `json:"mode,omitempty"`
	Limit     int    `json:"limit,omitempty"`
	File      string `json:"file,omitempty"`
	Container string `json:"container,omitempty"`
}

// Service talks to the backend insight endpoints over the shared client
// transport (HTTP and STDIO both work - see stdioRoutes in client/stdio.go).
type Service struct {
	c        *client.Client
	settings *settings.Service
}

func NewService(c *client.Client, settingsSvc *settings.Service) *Service {
	return &Service{c: c, settings: settingsSvc}
}

func (s *Service) Ensure(workspaceID string) (Status, error) {
	return client.DoOK[Status](s.c, "POST", "/workspaces/"+workspaceID+"/insight/ensure", map[string]any{}, nil)
}

func (s *Service) GetStatus(workspaceID string) (Status, error) {
	return client.DoOK[Status](s.c, "GET", "/workspaces/"+workspaceID+"/insight/status", nil, nil)
}

func (s *Service) Stop(workspaceID string) (map[string]any, error) {
	return client.DoOK[map[string]any](s.c, "DELETE", "/workspaces/"+workspaceID+"/insight", nil, nil)
}

func (s *Service) Sync(workspaceID string) (SyncResult, error) {
	return client.DoOK[SyncResult](s.c, "POST", "/workspaces/"+workspaceID+"/insight/sync", map[string]any{}, nil)
}

func (s *Service) Index(workspaceID string, force bool) (SyncResult, error) {
	return client.DoOK[SyncResult](s.c, "POST", "/workspaces/"+workspaceID+"/insight/index", map[string]any{"force": force}, nil)
}

func (s *Service) IndexStatus(workspaceID string) (IndexStatus, error) {
	return client.DoOK[IndexStatus](s.c, "GET", "/workspaces/"+workspaceID+"/insight/index/status", nil, nil)
}

func (s *Service) Search(workspaceID string, p SearchParams) (SearchResult, error) {
	q := map[string]string{"query": p.Query}
	if p.Mode != "" {
		q["mode"] = p.Mode
	}
	if p.Limit > 0 {
		q["limit"] = strconv.Itoa(p.Limit)
	}
	if p.File != "" {
		q["file"] = p.File
	}
	if p.Container != "" {
		q["container"] = p.Container
	}
	return client.DoOK[SearchResult](s.c, "GET", "/workspaces/"+workspaceID+"/insight/search", nil, q)
}

// insightKey builds the workspace-scoped settings key, mirroring
// workspaceKey() in apps/shared/workspace-settings.ts.
func insightKey(workspaceID string) string {
	return "workspace:" + workspaceID + ":insight"
}

func parseEnabled(raw *string) bool {
	if raw == nil || *raw == "" {
		return false
	}
	switch strings.ToLower(strings.TrimSpace(*raw)) {
	case "false", "0", "off", "disabled":
		return false
	case "true", "1", "on", "enabled":
		return true
	default:
		return false
	}
}

// IsEnabled reads the workspace insight toggle via the generic settings
// service (default false when absent/empty).
func (s *Service) IsEnabled(workspaceID string) (bool, error) {
	v, err := s.settings.GetValue(insightKey(workspaceID))
	if err != nil {
		return false, err
	}
	return parseEnabled(v.Value), nil
}

// SetEnabled writes the workspace insight toggle ("true"/"false") via the
// generic settings service.
func (s *Service) SetEnabled(workspaceID string, enabled bool) (bool, error) {
	v := "false"
	if enabled {
		v = "true"
	}
	if _, err := s.settings.SetValue(insightKey(workspaceID), v); err != nil {
		return false, err
	}
	return enabled, nil
}
