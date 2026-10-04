package client

import "net/http"

type Transport interface {
	Do(method, path string, body any, queryParams map[string]string) (*http.Response, error)
	DoStream(method, path string, body any, queryParams map[string]string) (*http.Response, error)
	OpenStream(method, path string, body any, queryParams map[string]string) (StreamReader, error)
}
