package mockapi

import (
	"encoding/base64"
	"net/http"
	"strconv"
	"sync"
	"time"
)

// 1x1 transparent PNG used as mock attachment bytes.
const mockPNGBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

type mockAttachment struct {
	ID               string `json:"id"`
	WorkspaceID      string `json:"workspaceId"`
	OriginalFilename string `json:"originalFilename"`
	StoredFilename   string `json:"storedFilename"`
	MediaType        string `json:"mediaType"`
	SizeBytes        int    `json:"sizeBytes"`
	Status           string `json:"status"`
	CreatedAt        string `json:"createdAt"`
	ExpiresAt        string `json:"expiresAt"`
}

var mockAttachmentBytes = sync.Map{}

func (s *Store) handleUploadAttachment(w http.ResponseWriter, r *http.Request) {
	wsID := r.PathValue("workspaceId")
	var body struct {
		Filename   string `json:"filename"`
		MediaType  string `json:"mediaType"`
		DataBase64 string `json:"dataBase64"`
	}
	if err := readBody(r, &body); err != nil || body.Filename == "" || body.MediaType == "" || body.DataBase64 == "" {
		writeError(w, r, http.StatusBadRequest, "filename, mediaType and dataBase64 are required")
		return
	}
	raw, err := base64.StdEncoding.DecodeString(body.DataBase64)
	if err != nil {
		raw, _ = base64.StdEncoding.DecodeString(mockPNGBase64)
	}
	id := "00000000-0000-4000-8000-" + newID()[:12]
	now := time.Now().UTC()
	meta := mockAttachment{
		ID:               id,
		WorkspaceID:      wsID,
		OriginalFilename: body.Filename,
		StoredFilename:   id + "__" + body.Filename,
		MediaType:        body.MediaType,
		SizeBytes:        len(raw),
		Status:           "pending",
		CreatedAt:        now.Format(time.RFC3339),
		ExpiresAt:        now.Add(24 * time.Hour).Format(time.RFC3339),
	}
	mockAttachmentBytes.Store(id, raw)
	writeJSON(w, r, http.StatusCreated, map[string]any{"attachment": meta})
}

func (s *Store) handleGetAttachment(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("attachmentId")
	raw, _ := mockAttachmentBytes.Load(id)
	data, ok := raw.([]byte)
	if !ok || len(data) == 0 {
		var err error
		data, err = base64.StdEncoding.DecodeString(mockPNGBase64)
		if err != nil {
			writeError(w, r, http.StatusNotFound, "Attachment "+id+" not found")
			return
		}
	}
	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Content-Length", strconv.Itoa(len(data)))
	w.Header().Set("Cache-Control", "private, max-age=3600")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}
