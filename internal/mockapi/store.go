package mockapi

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"strings"
	"time"
)

func ts() string {
	return time.Now().UTC().Format(time.RFC3339)
}

func strPtr(s string) *string {
	return &s
}

func int64Ptr(n int64) *int64 {
	return &n
}

func boolPtr(b bool) *bool {
	return &b
}

func newID() string {
	const hex = "0123456789abcdef"
	b := make([]byte, 16)
	for i := range b {
		b[i] = hex[rand.Intn(len(hex))]
	}
	return string(b)
}

func newRequestID() string {
	return "req-" + newID()
}

func newResponseID() string {
	return "resp-" + newID()
}

type Collection[T any] struct {
	items []T
}

func NewCollection[T any](items []T) *Collection[T] {
	return &Collection[T]{items: items}
}

func (c *Collection[T]) All() []T {
	out := make([]T, len(c.items))
	copy(out, c.items)
	return out
}

func (c *Collection[T]) Find(fn func(T) bool) (T, bool) {
	for _, item := range c.items {
		if fn(item) {
			return item, true
		}
	}
	var zero T
	return zero, false
}

func (c *Collection[T]) Filter(fn func(T) bool) []T {
	var out []T
	for _, item := range c.items {
		if fn(item) {
			out = append(out, item)
		}
	}
	return out
}

func (c *Collection[T]) Add(item T) {
	c.items = append(c.items, item)
}

func (c *Collection[T]) Update(fn func(T) bool, mutate func(*T)) bool {
	for i := range c.items {
		if fn(c.items[i]) {
			mutate(&c.items[i])
			return true
		}
	}
	return false
}

func (c *Collection[T]) Remove(fn func(T) bool) bool {
	for i := range c.items {
		if fn(c.items[i]) {
			c.items = append(c.items[:i], c.items[i+1:]...)
			return true
		}
	}
	return false
}

type Store struct {
	Workspaces   *Collection[Workspace]
	Providers    *Collection[Provider]
	Models       *Collection[ProviderModel]
	Chats        *Collection[Chat]
	Notes        *Collection[Note]
	Categories   *Collection[Category]
	Settings     map[string]string
	Messages     []mockMessage
	Runs         *Collection[MockRun]
	FileTree     FileNode
	FileContents map[string]string
}

func rawToFileNode(r rawFileNode) FileNode {
	n := FileNode{
		ID:          r.ID,
		Name:        r.Name,
		Path:        r.Path,
		Type:        r.Type,
		IsDirectory: r.IsDirectory,
	}
	if r.Size != 0 {
		v := int64(r.Size)
		n.Size = &v
	}
	if r.LastModified != 0 {
		v := int64(r.LastModified)
		n.LastModified = &v
	}
	if r.HasChildren {
		n.HasChildren = &r.HasChildren
	}
	for _, c := range r.Children {
		n.Children = append(n.Children, rawToFileNode(c))
	}
	return n
}

func (s *Store) findFileNode(targetPath string) *FileNode {
	if s.FileTree.Path == targetPath || targetPath == "." || targetPath == "/" || targetPath == "" {
		return &s.FileTree
	}
	parts := splitPath(targetPath)
	current := &s.FileTree
	for _, part := range parts {
		found := false
		for i := range current.Children {
			if current.Children[i].Name == part {
				current = &current.Children[i]
				found = true
				break
			}
		}
		if !found {
			return nil
		}
	}
	return current
}

func splitPath(p string) []string {
	var parts []string
	start := 0
	for i := 0; i < len(p); i++ {
		if p[i] == '/' {
			if i > start {
				parts = append(parts, p[start:i])
			}
			start = i + 1
		}
	}
	if start < len(p) {
		parts = append(parts, p[start:])
	}
	return parts
}

func (s *Store) listDirNodes(targetPath string) []FileNode {
	node := s.findFileNode(targetPath)
	if node == nil || !node.IsDirectory {
		return nil
	}
	return node.Children
}

func (s *Store) statNode(targetPath string) *FileNode {
	return s.findFileNode(targetPath)
}

func (s *Store) readFileContent(path string, maxBytes int) *ReadFileData {
	node := s.findFileNode(path)
	if node == nil {
		return nil
	}
	if node.IsDirectory {
		return nil
	}

	content, ok := s.FileContents[node.Path]
	if !ok {
		content = fmt.Sprintf("[File: %s]", node.Name)
	}

	size := len(content)
	truncated := false
	if maxBytes > 0 && size > maxBytes {
		content = content[:maxBytes]
		truncated = true
	}

	return &ReadFileData{
		Path:      node.Path,
		Content:   content,
		Encoding:  "utf-8",
		Size:      size,
		Truncated: truncated,
	}
}

func (s *Store) searchFileTree(query string, maxResults, maxDepth int) []FileNode {
	needle := strings.ToLower(strings.TrimSpace(query))
	if needle == "" {
		return []FileNode{}
	}

	out := make([]FileNode, 0, maxResults)
	var walk func(node FileNode, depth int)
	walk = func(node FileNode, depth int) {
		if len(out) >= maxResults || depth > maxDepth {
			return
		}
		for i := range node.Children {
			child := node.Children[i]
			if child.Name == "node_modules" || child.Name == ".git" {
				continue
			}
			haystack := strings.ToLower(child.Name) + " " + strings.ToLower(child.Path)
			if strings.Contains(haystack, needle) {
				out = append(out, child)
				if len(out) >= maxResults {
					return
				}
			}
			if child.IsDirectory {
				walk(child, depth+1)
			}
		}
	}
	walk(s.FileTree, 0)
	return out
}

func (s *Store) providerWithModels(p Provider) map[string]interface{} {
	models := s.Models.Filter(func(m ProviderModel) bool {
		return m.ProviderID == p.ID
	})
	return map[string]interface{}{
		"id":        p.ID,
		"name":      p.Name,
		"type":      p.Type,
		"apiKey":    p.APIKey,
		"baseURL":   p.BaseURL,
		"models":    models,
		"createdAt": p.CreatedAt,
		"updatedAt": p.UpdatedAt,
	}
}

func (s *Store) nextNoteRank() string {
	notes := s.Notes.All()
	max := 0
	for _, n := range notes {
		var r int
		fmt.Sscanf(n.Rank, "%d", &r)
		if r > max {
			max = r
		}
	}
	return fmt.Sprintf("%d", max+1)
}

func (s *Store) loadMessages(data []byte) error {
	return json.Unmarshal(data, &s.Messages)
}

func (s *Store) loadFileTree(data []byte) {
	var raw rawFileNode
	if err := json.Unmarshal(data, &raw); err != nil {
		panic("failed to parse mock-file-tree.json: " + err.Error())
	}
	s.FileTree = rawToFileNode(raw)
}
