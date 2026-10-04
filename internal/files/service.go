package files

import (
	"context"
	"strconv"

	"codryn/desktop/internal/client"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type FileNode struct {
	ID           string     `json:"id"`
	Name         string     `json:"name"`
	Path         string     `json:"path"`
	Type         string     `json:"type"`
	IsDirectory  bool       `json:"isDirectory"`
	Size         *int64     `json:"size,omitempty"`
	LastModified *int64     `json:"lastModified,omitempty"`
	HasChildren  *bool      `json:"hasChildren,omitempty"`
	Children     []FileNode `json:"children,omitempty"`
	Meta         *FileMeta  `json:"meta,omitempty"`
}

type FileMeta struct {
	IsSymlink     bool   `json:"isSymlink"`
	SymlinkTarget string `json:"symlinkTarget,omitempty"`
}

type ListDirData struct {
	RequestedPath string     `json:"requestedPath"`
	Nodes         []FileNode `json:"nodes"`
}

type GetStatData struct {
	Node FileNode `json:"node"`
}

type ReadFileData struct {
	Path      string `json:"path"`
	Content   string `json:"content"`
	Encoding  string `json:"encoding"`
	Size      int    `json:"size"`
	Truncated bool   `json:"truncated"`
}

type SearchFilesData struct {
	Query   string     `json:"query"`
	Matches []FileNode `json:"matches"`
}

type Service struct {
	c      *client.Client
	appCtx context.Context
}

func NewService(c *client.Client) *Service {
	return &Service{c: c}
}

func (s *Service) SetAppContext(ctx context.Context) {
	s.appCtx = ctx
}

func (s *Service) PickDirectory(title, defaultDirectory string) (string, error) {
	return runtime.OpenDirectoryDialog(s.appCtx, runtime.OpenDialogOptions{
		Title:            title,
		DefaultDirectory: defaultDirectory,
	})
}

func (s *Service) ListDir(workspaceID, path string) (ListDirData, error) {
	return client.DoOK[ListDirData](s.c, "GET", "/workspaces/"+workspaceID+"/files", nil, map[string]string{"path": path})
}

func (s *Service) GetStat(workspaceID, path string) (GetStatData, error) {
	return client.DoOK[GetStatData](s.c, "GET", "/workspaces/"+workspaceID+"/files/stat", nil, map[string]string{"path": path})
}

func (s *Service) ReadFile(workspaceID, path string, maxBytes *int) (ReadFileData, error) {
	q := map[string]string{"path": path}
	if maxBytes != nil {
		q["maxBytes"] = strconv.Itoa(*maxBytes)
	}
	return client.DoOK[ReadFileData](s.c, "GET", "/workspaces/"+workspaceID+"/files/read", nil, q)
}

func (s *Service) Search(workspaceID, path, query string, maxResults, maxDepth *int) (SearchFilesData, error) {
	q := map[string]string{"path": path, "query": query}
	if maxResults != nil {
		q["maxResults"] = strconv.Itoa(*maxResults)
	}
	if maxDepth != nil {
		q["maxDepth"] = strconv.Itoa(*maxDepth)
	}
	return client.DoOK[SearchFilesData](s.c, "GET", "/workspaces/"+workspaceID+"/files/search", nil, q)
}
