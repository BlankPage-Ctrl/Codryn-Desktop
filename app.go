package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
	"github.com/wailsapp/wails/v2/pkg/runtime"

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
	c := client.NewWithTransport(nil)

	settingsSvc := settings.NewService(c)

	return &App{
		Client:         c,
		Backend:        nil, // wired in startup(); stays nil for mock/HTTP modes.
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

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.FileWatch.SetAppContext(ctx)
	a.RunStream.SetAppContext(ctx)
	a.HitlWatch.SetAppContext(ctx)
	a.ShellExecWatch.SetAppContext(ctx)
	a.Files.SetAppContext(ctx)
	a.Attachments.SetAppContext(ctx)

	a.connectBackend(ctx)
}

// connectBackend resolves and wires the backend transport. This is the only
// place that may look up or spawn the backend CLI, and it runs solely when
// a user opens the app. Failures are reported to the user, never panicked.
func (a *App) connectBackend(ctx context.Context) {
	_ = godotenv.Load()

	if wd, err := os.Getwd(); err == nil {
		fmt.Fprintf(os.Stderr, "[backend] cwd=%s\n", wd)
	} else {
		fmt.Fprintf(os.Stderr, "[backend] cwd unknown: %v\n", err)
	}

	if os.Getenv("USE_MOCK") == "true" {
		fmt.Fprintf(os.Stderr, "[backend] transport=mock\n")
		mockapi.EnableMock(a.Client)
		return
	}
	if url := os.Getenv("BACKEND_URL"); url != "" {
		fmt.Fprintf(os.Stderr, "[backend] transport=http url=%s\n", url)
		a.Client.SetTransport(client.New().Transport())
		return
	}
	mgr, err := backend.NewManagerFromEnv()
	if err != nil {
		a.reportBackendError(ctx, err)
		return
	}
	fmt.Fprintf(os.Stderr, "[backend] transport=stdio bin=%s\n", mgr.Bin())
	mgr.SetLogFile(filepath.Join(logDir(), "backend.log"))
	transport, err := mgr.Start()
	if err != nil {
		a.reportBackendError(ctx, err)
		return
	}
	a.Backend = mgr
	a.Client.SetTransport(transport)
}

// reportBackendError informs the user that the backend is unavailable.
func (a *App) reportBackendError(ctx context.Context, err error) {
	fmt.Fprintf(os.Stderr, "[backend] %v\n", err)
	_, _ = runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
		Type:    runtime.ErrorDialog,
		Title:   "Codryn",
		Message: "Codryn backend not found. Please reinstall Codryn.",
	})
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
