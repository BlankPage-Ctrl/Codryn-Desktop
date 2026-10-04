package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

const DefaultBaseURL = "http://127.0.0.1:3000"
const DefaultClientID = "default-client"
const DefaultSecretKey = "default-01KY288BNYMXFXEK5GF3N82MT8"

const RequestIDHeader = "X-Request-Id"

type Client struct {
	transport Transport
}

func New() *Client {
	baseURL := os.Getenv("BACKEND_URL")
	if baseURL == "" {
		baseURL = DefaultBaseURL
	}
	return NewWithTransport(NewHTTPTransport(baseURL, DefaultClientID, DefaultSecretKey))
}

func NewWithTransport(t Transport) *Client {
	return &Client{transport: t}
}

func (c *Client) SetTransport(t Transport) {
	c.transport = t
}

func (c *Client) Transport() Transport {
	return c.transport
}

func (c *Client) Do(method, path string, body any, queryParams map[string]string) (*http.Response, error) {
	return c.transport.Do(method, path, body, queryParams)
}

func (c *Client) DoStream(method, path string, body any, queryParams map[string]string) (*http.Response, error) {
	return c.transport.DoStream(method, path, body, queryParams)
}

func (c *Client) OpenStream(method, path string, body any, queryParams map[string]string) (StreamReader, error) {
	return c.transport.OpenStream(method, path, body, queryParams)
}

type Envelope struct {
	RequestID  string          `json:"requestId"`
	ResponseID string          `json:"responseId"`
	Status     int             `json:"status"`
	Timestamp  string          `json:"timestamp"`
	Data       json.RawMessage `json:"data"`
	Error      *APIError       `json:"error"`
}

type APIError struct {
	Code       string          `json:"code"`
	Message    string          `json:"message"`
	Issues     json.RawMessage `json:"issues,omitempty"`
	Status     int             `json:"-"`
	RequestID  string          `json:"-"`
	ResponseID string          `json:"-"`
}

func (e *APIError) Error() string {
	if e == nil {
		return "api error"
	}
	msg := e.Message
	if msg == "" {
		msg = "request failed"
	}
	if e.Code == "" {
		return fmt.Sprintf("request failed (%d) requestId=%s: %s", e.Status, e.RequestID, msg)
	}
	return fmt.Sprintf("request failed (%d) [%s] requestId=%s: %s", e.Status, e.Code, e.RequestID, msg)
}

func toAPIError(raw []byte, status int, env *Envelope) error {
	if env != nil && env.Error != nil {
		e := env.Error
		e.Status = status
		e.RequestID = env.RequestID
		e.ResponseID = env.ResponseID
		return e
	}

	msg := string(raw)
	var legacy struct {
		Error string `json:"error"`
	}
	if json.Unmarshal(raw, &legacy) == nil && legacy.Error != "" {
		msg = legacy.Error
	}
	reqID := ""
	if env != nil {
		reqID = env.RequestID
	}
	return &APIError{
		Status:    status,
		Message:   msg,
		RequestID: reqID,
	}
}

func DoOK[T any](c *Client, method, path string, body any, queryParams map[string]string) (T, error) {
	var zero T
	resp, err := c.Do(method, path, body, queryParams)
	if err != nil {
		return zero, fmt.Errorf("request: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return zero, fmt.Errorf("read body: %w", err)
	}

	if resp.StatusCode == http.StatusNoContent {
		return zero, nil
	}

	var env Envelope
	hasEnvelope := json.Unmarshal(raw, &env) == nil &&
		(env.Data != nil || env.Error != nil)

	if resp.StatusCode >= 400 {
		return zero, toAPIError(raw, resp.StatusCode, &env)
	}

	if len(raw) == 0 {
		return zero, nil
	}

	if !hasEnvelope {
		var result T
		if err := json.Unmarshal(raw, &result); err != nil {
			return zero, fmt.Errorf("unmarshal: %w", err)
		}
		return result, nil
	}

	if env.Error != nil {
		return zero, toAPIError(raw, resp.StatusCode, &env)
	}

	if len(env.Data) == 0 || bytes.Equal(env.Data, []byte("null")) {
		return zero, nil
	}

	var result T
	if err := json.Unmarshal(env.Data, &result); err != nil {
		return zero, fmt.Errorf("unmarshal envelope data: %w", err)
	}
	return result, nil
}

func DoVoid(c *Client, method, path string, body any) error {
	resp, err := c.Do(method, path, body, nil)
	if err != nil {
		return fmt.Errorf("request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 400 {
		return nil
	}

	raw, _ := io.ReadAll(resp.Body)
	var env Envelope
	_ = json.Unmarshal(raw, &env)
	return toAPIError(raw, resp.StatusCode, &env)
}
