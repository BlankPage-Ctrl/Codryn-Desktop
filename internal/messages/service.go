package messages

import (
	"encoding/json"

	"codryn/desktop/internal/client"
)

// FeedEvent mirrors the backend custom chat-feed wire event
// (apps/shared/chat-feed FeedWireEvent / FeedHistoryEvent).
// The payload shape varies per `type` (text-open, work-ok, asset, ...),
// so the full raw object is preserved; the frontend reducer interprets it.
type FeedEvent map[string]any

// Type returns the feed event name (e.g. "text-delta", "run-close").
func (e FeedEvent) Type() string {
	t, _ := e["type"].(string)
	return t
}

type Service struct {
	c *client.Client
}

func NewService(c *client.Client) *Service {
	return &Service{c: c}
}

func (s *Service) LoadHistory(workspaceID, chatID string) ([]FeedEvent, error) {
	raw, err := client.DoOK[[]json.RawMessage](s.c, "GET", "/workspaces/"+workspaceID+"/chats/"+chatID+"/messages", nil, nil)
	if err != nil {
		return nil, err
	}
	events := make([]FeedEvent, 0, len(raw))
	for _, r := range raw {
		var e FeedEvent
		if err := json.Unmarshal(r, &e); err != nil {
			return nil, err
		}
		events = append(events, e)
	}
	return events, nil
}

// TokenUsageSum mirrors the backend aggregated token usage shape
// (Codryn src/messages/types/usage.ts). NULL step values arrive as 0.
type TokenUsageSum struct {
	InputTokens  int `json:"inputTokens"`
	OutputTokens int `json:"outputTokens"`
	TotalTokens  int `json:"totalTokens"`
	Steps        int `json:"steps"`
}

// ChatTokenUsage mirrors the backend get.chat-usage result JSON shape.
type ChatTokenUsage struct {
	TokenUsageSum
	ChatID string `json:"chatId"`
}

// MessageTokenUsage mirrors the backend get.message-usage result JSON shape.
type MessageTokenUsage struct {
	TokenUsageSum
	MessageID string `json:"messageId"`
}

// GetChatUsage returns aggregated token usage for the whole chat.
func (s *Service) GetChatUsage(workspaceID, chatID string) (ChatTokenUsage, error) {
	return client.DoOK[ChatTokenUsage](s.c, "GET", "/workspaces/"+workspaceID+"/chats/"+chatID+"/usage", nil, nil)
}

// GetMessageUsage returns aggregated token usage for one message.
func (s *Service) GetMessageUsage(workspaceID, chatID, messageID string) (MessageTokenUsage, error) {
	return client.DoOK[MessageTokenUsage](s.c, "GET", "/workspaces/"+workspaceID+"/chats/"+chatID+"/messages/"+messageID+"/usage", nil, nil)
}

// FileRestoreItem mirrors one restored/deleted path in the backend
// file-revert result (src/fm/types/history.ts FileRestoreItem).
type FileRestoreItem struct {
	Path string `json:"path"`
	Op   string `json:"op"`
}

// FileConflictWriter attributes the newest out-of-scope mutation of a
// conflicted path.
type FileConflictWriter struct {
	ChatID    string `json:"chatId"`
	MessageID string `json:"messageId"`
	CreatedAt string `json:"createdAt"`
}

// FileConflict mirrors one skipped path in the backend file-revert result.
type FileConflict struct {
	Path         string              `json:"path"`
	Reason       string              `json:"reason"`
	ExpectedHash *string             `json:"expectedHash"`
	CurrentHash  *string             `json:"currentHash"`
	LastWriter   *FileConflictWriter `json:"lastWriter"`
}

// FileRestore mirrors the backend revert.message-run fileRestore payload.
// Nil when the revert ran conversation-only (restoreFiles=false).
type FileRestore struct {
	Restored  []FileRestoreItem `json:"restored"`
	Conflicts []FileConflict    `json:"conflicts"`
}

// RevertResult mirrors the backend revert.message-run result JSON shape.
type RevertResult struct {
	DeletedMessageIDs []string     `json:"deletedMessageIds"`
	CancelledRunIDs   []string     `json:"cancelledRunIds"`
	FileRestore       *FileRestore `json:"fileRestore,omitempty"`
}

// RevertMessages cancels running runs in the chat and deletes the target
// user message plus all messages after it. When restoreFiles is true, files
// mutated by the deleted messages are additionally restored to their
// checkpoint state (collisions are detected and skipped server-side).
func (s *Service) RevertMessages(workspaceID, chatID, messageID string, restoreFiles bool) (RevertResult, error) {
	body := map[string]any{"messageId": messageID, "mode": "conversation", "restoreFiles": restoreFiles}
	return client.DoOK[RevertResult](s.c, "POST", "/workspaces/"+workspaceID+"/chats/"+chatID+"/revert", body, nil)
}

// RevertFilePlan mirrors one per-path entry of the backend revert preview
// (src/fm/types/history.ts FileRevertPlanItem).
type RevertFilePlan struct {
	Path         string              `json:"path"`
	Op           string              `json:"op"`
	Status       string              `json:"status"`
	Reason       *string             `json:"reason"`
	ExpectedHash *string             `json:"expectedHash"`
	CurrentHash  *string             `json:"currentHash"`
	LastWriter   *FileConflictWriter `json:"lastWriter"`
	DiffPreview  *string             `json:"diffPreview"`
}

// PreviewResult mirrors the backend preview.message-run result JSON shape.
// Read-only: nothing is cancelled, deleted, or restored.
type PreviewResult struct {
	TargetMessageID string           `json:"targetMessageId"`
	FromPosition    int              `json:"fromPosition"`
	SuffixIDs       []string         `json:"suffixIds"`
	Files           []RevertFilePlan `json:"files"`
}

// PreviewRevertMessages reports what reverting the target user message
// would delete and restore, without changing anything. Used to render the
// edit-draft banner (collision warning + restore-files toggle) before the
// user confirms with Send.
func (s *Service) PreviewRevertMessages(workspaceID, chatID, messageID string) (PreviewResult, error) {
	body := map[string]any{"messageId": messageID, "mode": "conversation"}
	return client.DoOK[PreviewResult](s.c, "POST", "/workspaces/"+workspaceID+"/chats/"+chatID+"/revert/preview", body, nil)
}
