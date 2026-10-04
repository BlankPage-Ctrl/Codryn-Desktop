package main

import (
	"context"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"

	"codryn/desktop/internal/attachments"
	"codryn/desktop/internal/backend"
	"codryn/desktop/internal/categories"
	"codryn/desktop/internal/chats"
	"codryn/desktop/internal/client"
	"codryn/desktop/internal/files"
	"codryn/desktop/internal/hitl"
	"codryn/desktop/internal/insight"
	"codryn/desktop/internal/mcp"
	"codryn/desktop/internal/messages"
	"codryn/desktop/internal/mockapi"
	"codryn/desktop/internal/models"
	"codryn/desktop/internal/notes"
	"codryn/desktop/internal/providers"
	"codryn/desktop/internal/settings"
	"codryn/desktop/internal/stream"
	"codryn/desktop/internal/workspaces"
)

type App struct {
	ctx            context.Context
	Client         *client.Client
	Backend        *backend.Manager
	Workspaces     *workspaces.Service
	Chats          *chats.Service
	Messages       *messages.Service
	Notes          *notes.Service
	Categories     *categories.Service
	Providers      *providers.Service
	Models         *models.Service
	Settings       *settings.Service
	Files          *files.Service
	Attachments    *attachments.Service
	FileWatch      *stream.FileWatchService
	RunStream      *stream.RunStreamService
	Hitl           *hitl.Service
	HitlWatch      *stream.HitlWatchService
	Insight        *insight.Service
	Mcp            *mcp.Service
	ShellExecWatch *stream.ShellExecWatchService
}

func NewApp() *App {
	_ = godotenv.Load()

	backendMgr, transport, err := resolveTransport()
	if err != nil {
		panic(err)
	}

	c := client.NewWithTransport(transport)

	if os.Getenv("USE_MOCK") == "true" {
		mockapi.EnableMock(c)
	}

	settingsSvc := settings.NewService(c)

	return &App{
		Client:         c,
		Backend:        backendMgr,
		Workspaces:     workspaces.NewService(c),
		Chats:          chats.NewService(c),
		Messages:       messages.NewService(c),
		Notes:          notes.NewService(c),
		Categories:     categories.NewService(c),
		Providers:      providers.NewService(c),
		Models:         models.NewService(c),
		Settings:       settingsSvc,
		Files:          files.NewService(c),
		Attachments:    attachments.NewService(c),
		FileWatch:      stream.NewFileWatchService(c),
		RunStream:      stream.NewRunStreamService(c),
		Hitl:           hitl.NewService(c),
		HitlWatch:      stream.NewHitlWatchService(c),
		Insight:        insight.NewService(c, settingsSvc),
		Mcp:            mcp.NewService(c),
		ShellExecWatch: stream.NewShellExecWatchService(c),
	}
}

// resolveTransport picks the delivery boundary, highest to lowest:
//   - USE_MOCK=true       -> in-process HTTP mock (mirrors real routes)
//   - BACKEND_URL set     -> external HTTP backend, no spawn (manual dev)
//   - otherwise           -> spawn the backend CLI (codryn on OS PATH) over STDIO
func resolveTransport() (*backend.Manager, client.Transport, error) {
	if os.Getenv("USE_MOCK") == "true" {
		return nil, nil, nil // mock transport is set by EnableMock below
	}
	if os.Getenv("BACKEND_URL") != "" {
		return nil, client.New().Transport(), nil
	}
	mgr, err := backend.NewManagerFromEnv()
	if err != nil {
		return nil, nil, err
	}
	mgr.SetLogFile(filepath.Join(logDir(), "backend.log"))
	transport, err := mgr.Start()
	if err != nil {
		return nil, nil, err
	}
	return mgr, transport, nil
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.FileWatch.SetAppContext(ctx)
	a.RunStream.SetAppContext(ctx)
	a.HitlWatch.SetAppContext(ctx)
	a.ShellExecWatch.SetAppContext(ctx)
	a.Files.SetAppContext(ctx)
	a.Attachments.SetAppContext(ctx)
}

// onShutdown stops the spawned backend cleanly.
func (a *App) onShutdown(ctx context.Context) {
	if a.Backend != nil {
		a.Backend.Stop()
	}
}

// logDir returns the desktop log folder used by the backend manager.
func logDir() string {
	if wd, err := os.Getwd(); err == nil {
		dir := filepath.Join(wd, "stream-logs")
		_ = os.MkdirAll(dir, 0o755)
		return dir
	}
	return "stream-logs"
}
