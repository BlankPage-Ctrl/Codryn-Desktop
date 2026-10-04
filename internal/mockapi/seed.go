package mockapi

import (
	_ "embed"
)

//go:embed mock-messages.json
var mockMessagesRaw []byte

//go:embed mock-file-tree.json
var mockFileTreeRaw []byte

var mockFileContents = map[string]string{
	"src/index.ts":                       `import express from 'express';` + "\n\nconst app = express();\napp.listen(3000);",
	"src/controllers/auth.controller.ts": `export class AuthController {\n  login() {}\n  register() {}\n}`,
	"src/data/users.ts":                  `export const users = [];`,
	"src/middleware/auth.middleware.ts":  `export const authMiddleware = (req, res, next) => next();`,
	"src/routes/auth.routes.ts":          `import { Router } from 'express';\nexport const authRoutes = Router();`,
	"src/services/auth.service.ts":       `export class AuthService {\n  findById() {}\n  create() {}\n}`,
	"src/types/express.d.ts":             `declare namespace Express {\n  interface Request {\n    user?: any;\n  }\n}`,
	"src/types/index.ts":                 `export interface User {\n  id: string;\n  name: string;\n}`,
	".gitignore":                         "node_modules/\ndist/\n.env",
	"package.json":                       `{"name":"project-test","version":"1.0.0","private":true}`,
	"tsconfig.json":                      `{"compilerOptions":{"target":"ES2020","module":"commonjs"}}`,
}

var (
	wsID  = "550e8400-e29b-41d4-a716-446655440001"
	pvID  = "550e8400-e29b-41d4-a716-446655440002"
	mdID  = "550e8400-e29b-41d4-a716-446655440003"
	md2ID = "550e8400-e29b-41d4-a716-446655440005"
	md3ID = "550e8400-e29b-41d4-a716-446655440006"
	chID  = "550e8400-e29b-41d4-a716-446655440004"
	ntID  = "550e8400-e29b-41d4-a716-446655440007"
	nt2ID = "550e8400-e29b-41d4-a716-446655440008"
	ctID  = "550e8400-e29b-41d4-a716-446655440009"
	ct2ID = "550e8400-e29b-41d4-a716-44665544000a"
)

func NewSeedStore() *Store {
	now := ts()

	store := &Store{
		Workspaces: NewCollection([]Workspace{
			{ID: wsID, Name: "Test Project", Description: strPtr("A mock workspace for development"), ProjectPath: "/home/user/projects/test", CreatedAt: now, UpdatedAt: now},
		}),
		Providers: NewCollection([]Provider{
			{ID: pvID, Name: "OpenAI", Type: "openai", APIKey: strPtr("sk-***mock"), BaseURL: nil, CreatedAt: now, UpdatedAt: now},
		}),
		Models: NewCollection([]ProviderModel{
			{ID: mdID, ModelID: "gpt-4o", DisplayName: strPtr("GPT-4o"), ProviderID: pvID, CreatedAt: now, UpdatedAt: now},
			{ID: md2ID, ModelID: "gpt-5.4", DisplayName: strPtr("GPT-5.4"), ProviderID: pvID, CreatedAt: now, UpdatedAt: now},
			{ID: md3ID, ModelID: "gpt-ngawi", DisplayName: strPtr("GPT-NGAWI"), ProviderID: pvID, CreatedAt: now, UpdatedAt: now},
		}),
		Chats: NewCollection([]Chat{
			{ID: chID, Title: "Test Chat", ProviderID: &pvID, ModelID: &mdID, SystemPrompt: nil, WorkspaceID: wsID, CreatedAt: now, UpdatedAt: now},
		}),
		Notes: NewCollection([]Note{
			{ID: ntID, Name: "Setup Guide", CategoryID: ctID, Desc: "Initial project setup instructions", Details: "## Steps\n1. Clone repo\n2. Install deps\n3. Run dev server", Rank: "0", Priority: "high", CreatedAt: now, UpdatedAt: now, Version: 1},
			{ID: nt2ID, Name: "API Reference", CategoryID: ct2ID, Desc: "Notes on API endpoints", Details: "REST API with HMAC auth.", Rank: "1", Priority: "medium", CreatedAt: now, UpdatedAt: now, Version: 1},
		}),
		Categories: NewCollection([]Category{
			{ID: ctID, Name: "Development", Color: strPtr("#3b82f6"), IsDefault: false, CreatedAt: now},
			{ID: ct2ID, Name: "Documentation", Color: strPtr("#10b981"), IsDefault: false, CreatedAt: now},
		}),
		Settings: map[string]string{
			"defaultProviderId": pvID,
			"defaultModelId":    mdID,
		},
		Runs:         NewCollection([]MockRun{}),
		FileContents: mockFileContents,
	}

	store.loadFileTree(mockFileTreeRaw)
	store.loadMessages(mockMessagesRaw)

	return store
}
