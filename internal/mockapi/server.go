package mockapi

import (
	"net/http/httptest"

	"codryn/desktop/internal/client"
)

func EnableMock(c *client.Client) {
	store := NewSeedStore()
	handler := store.NewHandler()
	server := httptest.NewServer(handler)
	c.SetTransport(client.NewHTTPTransport(server.URL, client.DefaultClientID, client.DefaultSecretKey))
}

func EnableMockWithHandler(c *client.Client, store *Store) {
	handler := store.NewHandler()
	server := httptest.NewServer(handler)
	c.SetTransport(client.NewHTTPTransport(server.URL, client.DefaultClientID, client.DefaultSecretKey))
}
