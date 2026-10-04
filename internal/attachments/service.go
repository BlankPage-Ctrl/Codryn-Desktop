package attachments

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"codryn/desktop/internal/client"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// Limits mirror packages/backend/src/attachments/types/attachment.ts.
const maxAttachmentBytes = 8 * 1024 * 1024

// AttachmentMeta mirrors the backend AttachmentMeta JSON shape returned by
// POST /workspaces/:workspaceId/attachments.
type AttachmentMeta struct {
	ID               string  `json:"id"`
	WorkspaceID      string  `json:"workspaceId"`
	OriginalFilename string  `json:"originalFilename"`
	StoredFilename   string  `json:"storedFilename"`
	MediaType        string  `json:"mediaType"`
	SizeBytes        int     `json:"sizeBytes"`
	Status           string  `json:"status"`
	CreatedAt        string  `json:"createdAt"`
	ExpiresAt        *string `json:"expiresAt"`
}

// UploadResult mirrors the POST attachments response envelope data.
type UploadResult struct {
	Attachment AttachmentMeta `json:"attachment"`
}

// PickedImage is one file chosen via the native dialog. The bytes are
// base64-encoded so the frontend can preview instantly and upload as-is.
type PickedImage struct {
	Filename   string `json:"filename"`
	MediaType  string `json:"mediaType"`
	DataBase64 string `json:"dataBase64"`
	SizeBytes  int    `json:"sizeBytes"`
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

func mediaTypeForExt(ext string) (string, bool) {
	switch strings.ToLower(ext) {
	case ".png":
		return "image/png", true
	case ".jpg", ".jpeg":
		return "image/jpeg", true
	case ".webp":
		return "image/webp", true
	case ".gif":
		return "image/gif", true
	default:
		return "", false
	}
}

// PickImages opens the native multi-select dialog filtered to images and
// returns the chosen files with base64 payloads. Cancelling resolves to an
// empty list (not an error). Files that are not images or exceed the backend
// 8 MiB limit are skipped client-side.
func (s *Service) PickImages() ([]PickedImage, error) {
	paths, err := runtime.OpenMultipleFilesDialog(s.appCtx, runtime.OpenDialogOptions{
		Title: "Attach images",
		Filters: []runtime.FileFilter{
			{DisplayName: "Images", Pattern: "*.png;*.jpg;*.jpeg;*.webp;*.gif"},
		},
	})
	if err != nil {
		return nil, err
	}
	out := make([]PickedImage, 0, len(paths))
	for _, p := range paths {
		mediaType, ok := mediaTypeForExt(filepath.Ext(p))
		if !ok {
			continue
		}
		raw, err := os.ReadFile(p)
		if err != nil {
			continue
		}
		if len(raw) == 0 || len(raw) > maxAttachmentBytes {
			continue
		}
		out = append(out, PickedImage{
			Filename:   filepath.Base(p),
			MediaType:  mediaType,
			DataBase64: base64.StdEncoding.EncodeToString(raw),
			SizeBytes:  len(raw),
		})
	}
	return out, nil
}

// UploadAttachment stores one image via POST /workspaces/:workspaceId/attachments.
// The returned attachment is `pending` until referenced by a sent message,
// which flips it to `linked` server-side.
func (s *Service) UploadAttachment(workspaceID, filename, mediaType, dataBase64 string) (UploadResult, error) {
	body := map[string]any{
		"filename":   filename,
		"mediaType":  mediaType,
		"dataBase64": dataBase64,
	}
	return client.DoOK[UploadResult](s.c, "POST", "/workspaces/"+workspaceID+"/attachments", body, nil)
}

// GetAttachmentDataURL fetches raw attachment bytes and returns a data-URL
// for <img> rendering. Used for history thumbnails whose persisted message
// parts only carry opaque `attachment://<id>` refs.
// Over HTTP the backend returns raw bytes; over STDIO it returns a JSON
// envelope with {attachment, dataBase64}, so both shapes are handled here.
func (s *Service) GetAttachmentDataURL(workspaceID, attachmentID string) (string, error) {
	resp, err := s.c.Do("GET", "/workspaces/"+workspaceID+"/attachments/"+attachmentID, nil, nil)
	if err != nil {
		return "", fmt.Errorf("attachment: request: %w", err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("attachment: read body: %w", err)
	}
	if resp.StatusCode >= 400 {
		msg := strings.TrimSpace(string(raw))
		if msg == "" {
			msg = resp.Status
		}
		return "", fmt.Errorf("attachment: request failed (%d): %s", resp.StatusCode, msg)
	}
	if resp.Header.Get("Content-Type") == "application/json" {
		var env struct {
			Data *struct {
				Attachment *AttachmentMeta `json:"attachment"`
				DataBase64 string          `json:"dataBase64"`
			} `json:"data"`
		}
		if err := json.Unmarshal(raw, &env); err == nil && env.Data != nil && env.Data.DataBase64 != "" {
			mediaType := "application/octet-stream"
			if env.Data.Attachment != nil && env.Data.Attachment.MediaType != "" {
				mediaType = env.Data.Attachment.MediaType
			} else if ct := resp.Header.Get("Content-Type"); ct != "" && ct != "application/json" {
				mediaType = ct
			}
			return "data:" + mediaType + ";base64," + env.Data.DataBase64, nil
		}
	}
	mediaType := resp.Header.Get("Content-Type")
	if mediaType == "" || mediaType == "application/json" {
		mediaType = "application/octet-stream"
	}
	return "data:" + mediaType + ";base64," + base64.StdEncoding.EncodeToString(raw), nil
}
