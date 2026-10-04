package mockapi

type Workspace struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description *string `json:"description"`
	ProjectPath string  `json:"projectPath"`
	CreatedAt   string  `json:"createdAt"`
	UpdatedAt   string  `json:"updatedAt"`
}

type Provider struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Type      string  `json:"type"`
	APIKey    *string `json:"apiKey"`
	BaseURL   *string `json:"baseURL"`
	CreatedAt string  `json:"createdAt"`
	UpdatedAt string  `json:"updatedAt"`
}

type ProviderModel struct {
	ID              string  `json:"id"`
	ModelID         string  `json:"modelId"`
	DisplayName     *string `json:"displayName"`
	ProviderID      string  `json:"providerId"`
	MaxInputTokens  *int    `json:"maxInputTokens"`
	MaxOutputTokens *int    `json:"maxOutputTokens"`
	CreatedAt       string  `json:"createdAt"`
	UpdatedAt       string  `json:"updatedAt"`
}

type Chat struct {
	ID           string  `json:"id"`
	Title        string  `json:"title"`
	ProviderID   *string `json:"providerId"`
	ModelID      *string `json:"modelId"`
	SystemPrompt *string `json:"systemPrompt"`
	ThinkingMode string  `json:"thinkingMode"`
	WorkspaceID  string  `json:"workspaceId"`
	CreatedAt    string  `json:"createdAt"`
	UpdatedAt    string  `json:"updatedAt"`
}

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

type Category struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Color     *string `json:"color"`
	IsDefault bool    `json:"is_default"`
	CreatedAt string  `json:"created_at"`
}

type DefaultProvider struct {
	ProviderID *string `json:"providerId"`
	ModelID    *string `json:"modelId"`
}

type SettingValue struct {
	Key   string  `json:"key"`
	Value *string `json:"value"`
}

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

type rawFileNode struct {
	ID           string        `json:"id"`
	Name         string        `json:"name"`
	Path         string        `json:"path"`
	Type         string        `json:"type"`
	IsDirectory  bool          `json:"isDirectory"`
	Size         float64       `json:"size,omitempty"`
	LastModified float64       `json:"lastModified,omitempty"`
	HasChildren  bool          `json:"hasChildren,omitempty"`
	Children     []rawFileNode `json:"children,omitempty"`
}
