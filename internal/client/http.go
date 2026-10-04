package client

import (
	"bytes"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"
)

// HTTPTransport talks to the backend over HTTP (HMAC-authed). Its behavior
// is unchanged from the original Client; it only moved behind the Transport
// interface so the STDIO transport can sit beside it.
type HTTPTransport struct {
	BaseURL   string
	ClientID  string
	SecretKey string
	HTTP      *http.Client
	Stream    *http.Client
}

func NewHTTPTransport(baseURL, clientID, secretKey string) *HTTPTransport {
	if baseURL == "" {
		baseURL = DefaultBaseURL
	}
	return &HTTPTransport{
		BaseURL:   baseURL,
		ClientID:  clientID,
		SecretKey: secretKey,
		HTTP:      &http.Client{Timeout: 30 * time.Second},
		Stream:    &http.Client{},
	}
}

func (t *HTTPTransport) Do(method, path string, body any, queryParams map[string]string) (*http.Response, error) {
	return t.do(t.HTTP, method, path, body, queryParams)
}

func (t *HTTPTransport) DoStream(method, path string, body any, queryParams map[string]string) (*http.Response, error) {
	return t.do(t.Stream, method, path, body, queryParams)
}

func (t *HTTPTransport) OpenStream(method, path string, body any, queryParams map[string]string) (StreamReader, error) {
	resp, err := t.do(t.Stream, method, path, body, queryParams)
	if err != nil {
		return nil, err
	}
	return newHTTPStreamReader(resp), nil
}

func (t *HTTPTransport) do(httpClient *http.Client, method, path string, body any, queryParams map[string]string) (*http.Response, error) {
	u, err := url.Parse(t.BaseURL + path)
	if err != nil {
		return nil, fmt.Errorf("invalid url: %w", err)
	}

	q := u.Query()
	for k, v := range queryParams {
		q.Set(k, v)
	}
	u.RawQuery = q.Encode()

	var bodyReader io.Reader
	var bodyStr string
	if body != nil {
		b, err := marshalBody(body)
		if err != nil {
			return nil, fmt.Errorf("marshal body: %w", err)
		}
		bodyStr = string(b)
		bodyReader = bytes.NewReader(b)
	}

	requestID := newRequestID()
	headers := t.buildAuthHeaders(method, u.Path, u.RawQuery, bodyStr, requestID)

	req, err := http.NewRequest(method, u.String(), bodyReader)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	for k, v := range headers {
		req.Header.Set(k, v)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	return httpClient.Do(req)
}

func newRequestID() string {
	var b [8]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "req-" + strconv.FormatInt(time.Now().UnixNano(), 16)
	}
	return "req-" + hex.EncodeToString(b[:])
}

// marshalBody encodes JSON without HTML escaping (<>& stay literal) so the
// wire bytes match what a JS JSON.stringify client would send. The backend
// verifies exact wire bytes (req.rawBody), so this is strictly for
// interoperability/debuggability - signatures match either way.
func marshalBody(v any) ([]byte, error) {
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	if err := enc.Encode(v); err != nil {
		return nil, err
	}
	b := buf.Bytes()
	if len(b) > 0 && b[len(b)-1] == '\n' {
		b = b[:len(b)-1]
	}
	return b, nil
}

func sortQueryString(qs string) string {
	if qs == "" {
		return ""
	}
	parts := strings.Split(qs, "&")
	sort.Strings(parts)
	return strings.Join(parts, "&")
}

func buildCanonical(method, path, queryString, timestamp, requestID, body string) string {
	canonicalPath := path
	if !strings.HasPrefix(canonicalPath, "/") {
		canonicalPath = "/" + canonicalPath
	}

	bodyHash := sha256Hex(body)
	sortedQuery := sortQueryString(queryString)

	return strings.Join([]string{
		strings.ToUpper(method),
		canonicalPath,
		sortedQuery,
		timestamp,
		requestID,
		bodyHash,
	}, "\n")
}

func (t *HTTPTransport) buildAuthHeaders(method, path, queryString, body, requestID string) map[string]string {
	ts := strconv.FormatInt(time.Now().Unix(), 10)
	canonical := buildCanonical(method, path, queryString, ts, requestID, body)

	stringToSign := "HMAC-SHA256\n" + sha256Hex(canonical)
	signature := hmacSha256Hex(t.SecretKey, stringToSign)

	return map[string]string{
		"X-Client-Id":  t.ClientID,
		"X-Timestamp":  ts,
		"X-Request-Id": requestID,
		"X-Signature":  "HMAC-SHA256=" + signature,
	}
}

func sha256Hex(data string) string {
	h := sha256.Sum256([]byte(data))
	return hex.EncodeToString(h[:])
}

func hmacSha256Hex(secret, data string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(data))
	return hex.EncodeToString(mac.Sum(nil))
}
