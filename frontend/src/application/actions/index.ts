import {
    useWorkspaceStorer,
    useChatStorer,
    useProviderStorer,
    useThemeStorer,
    useAppearanceStorer,
    useFileExplorerStorer,
    useNoteStorer,
    useChatSessionStorer,
    useHitlStorer,
    useInsightStorer,
    useMcpStorer,
} from '../stores'

import {
    workspacesRepository,
    chatsRepository,
    providersRepository,
    modelsRepository,
    settingsRepository,
    messagesRepository,
    runsRepository,
    filesRepository,
    notesRepository,
    categoriesRepository,
    hitlRepository,
    insightRepository,
    mcpRepository,
    attachmentsRepository,
} from '@/data/services'
import { fileWatch, createFeedStreamPort, hitlWatch } from '@/data/stream'

import { createWorkspaceStoreLogic } from '../store-logic/workspace.logic'
import { createChatStoreLogic } from '../store-logic/chat.logic'
import { createProviderStoreLogic } from '../store-logic/provider.logic'
import { createThemeStoreLogic } from '../store-logic/theme.logic'
import { createAppearanceStoreLogic } from '../store-logic/appearance.logic'
import { createFileExplorerStoreLogic } from '../store-logic/file-explorer.logic'
import { createNoteStoreLogic } from '../store-logic/note.logic'
import { createChatSessionStoreLogic } from '../store-logic/chat-session.logic'
import { createHitlStoreLogic } from '../store-logic/hitl.logic'
import { createInsightStoreLogic } from '../store-logic/insight.logic'
import { createMcpStoreLogic } from '../store-logic/mcp.logic'

import { createWorkspaceBusinessLogic } from '../business-logic/workspace.logic'
import { createChatBusinessLogic } from '../business-logic/chat.logic'
import { createProviderBusinessLogic } from '../business-logic/provider.logic'
import { createThemeBusinessLogic } from '../business-logic/theme.logic'
import { createAppearanceBusinessLogic } from '../business-logic/appearance.logic'
import { createFileExplorerBusinessLogic } from '../business-logic/file-explorer.logic'
import { createNoteBusinessLogic } from '../business-logic/note.logic'
import { createChatSessionEngine } from '../business-logic/chat-session.logic'
import { createHitlBusinessLogic } from '../business-logic/hitl.logic'
import { createInsightBusinessLogic } from '../business-logic/insight.logic'
import { createMcpBusinessLogic } from '../business-logic/mcp.logic'

import { createWorkspaceActions } from './workspace.actions'
import { createAttachmentActions } from './attachment.actions'
import { createChatActions } from './chat.actions'
import { createProviderActions } from './provider.actions'
import { createThemeActions } from './theme.actions'
import { createAppearanceActions } from './appearance.actions'
import { createFileExplorerActions } from './file-explorer.actions'
import { createChatSessionActions } from './chat-session.actions'
import { createNoteActions } from './note.actions'
import { createHitlActions } from './hitl.actions'
import { createInsightActions } from './insight.actions'
import { createMcpActions } from './mcp.actions'

const workspaceStoreLogic = createWorkspaceStoreLogic(() => useWorkspaceStorer())
const workspaceBusinessLogic = createWorkspaceBusinessLogic(workspacesRepository)

export const workspaceActions = createWorkspaceActions(workspaceStoreLogic, workspaceBusinessLogic)

export const attachmentActions = createAttachmentActions(attachmentsRepository)

const chatStoreLogic = createChatStoreLogic(() => useChatStorer())
const chatBusinessLogic = createChatBusinessLogic(chatsRepository)

export const chatActions = createChatActions(chatStoreLogic, chatBusinessLogic)

const providerStoreLogic = createProviderStoreLogic(() => useProviderStorer())
const providerBusinessLogic = createProviderBusinessLogic({
    providersRepo: providersRepository,
    modelsRepo: modelsRepository,
    settingsRepo: settingsRepository,
})

export const providerActions = createProviderActions(providerStoreLogic, providerBusinessLogic)

const themeStoreLogic = createThemeStoreLogic(() => useThemeStorer())
const themeBusinessLogic = createThemeBusinessLogic()

export const themeActions = createThemeActions(themeStoreLogic, themeBusinessLogic)

const appearanceStoreLogic = createAppearanceStoreLogic(() => useAppearanceStorer())
const appearanceBusinessLogic = createAppearanceBusinessLogic()

export const appearanceActions = createAppearanceActions(
    appearanceStoreLogic,
    appearanceBusinessLogic,
)

const fileExplorerStoreLogic = createFileExplorerStoreLogic(() => useFileExplorerStorer())
const fileExplorerBusinessLogic = createFileExplorerBusinessLogic({
    fileRepo: filesRepository,
    watch: fileWatch,
})

export const fileExplorerActions = createFileExplorerActions(
    fileExplorerStoreLogic,
    fileExplorerBusinessLogic,
)

const chatSessionStoreLogic = createChatSessionStoreLogic(() => useChatSessionStorer())
const feedStreamPort = createFeedStreamPort()
const chatSessionEngine = createChatSessionEngine({
    messagesRepo: messagesRepository,
    runsRepo: runsRepository,
    stream: feedStreamPort,
    onState: (chatId, patch) => chatSessionStoreLogic.patch(chatId, patch),
})

export const chatSessionActions = createChatSessionActions(chatSessionStoreLogic, chatSessionEngine)

const noteStoreLogic = createNoteStoreLogic(() => useNoteStorer())
const noteBusinessLogic = createNoteBusinessLogic({
    notes: notesRepository,
    categories: categoriesRepository,
})

export const noteActions = createNoteActions(noteStoreLogic, noteBusinessLogic)

const hitlStoreLogic = createHitlStoreLogic(() => useHitlStorer())
const hitlBusinessLogic = createHitlBusinessLogic({ repo: hitlRepository, watch: hitlWatch })

export const hitlActions = createHitlActions(hitlStoreLogic, hitlBusinessLogic)

const insightStoreLogic = createInsightStoreLogic(() => useInsightStorer())
const insightBusinessLogic = createInsightBusinessLogic({ repo: insightRepository })

export const insightActions = createInsightActions(insightStoreLogic, insightBusinessLogic)

const mcpStoreLogic = createMcpStoreLogic(() => useMcpStorer())
const mcpBusinessLogic = createMcpBusinessLogic({ repo: mcpRepository })

export const mcpActions = createMcpActions(mcpStoreLogic, mcpBusinessLogic)

export type { WorkspaceActions } from './workspace.actions'
export type { AttachmentActions } from './attachment.actions'
export type { ChatActions } from './chat.actions'
export type { ProviderActions } from './provider.actions'
export type { ThemeActions } from './theme.actions'
export type { AppearanceActions } from './appearance.actions'
export type { FileExplorerActions } from './file-explorer.actions'
export type { ChatSessionActions } from './chat-session.actions'
export type { NoteActions } from './note.actions'
export type { HitlActions } from './hitl.actions'
export type { InsightActions } from './insight.actions'
export type { McpActions } from './mcp.actions'
