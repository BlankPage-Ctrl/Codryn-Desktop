import type { ChatStoreLogic } from '../store-logic/chat.logic'
import type { ChatBusinessLogic } from '../business-logic/chat.logic'
import type { Chat, ChatDto, ChatMode } from '@/core/entities'
import { toMessage } from '@/shared/utils/error.utils'
import { buildPendingChatId } from '@/shared/utils/chat.utils'

export interface PendingChatOptions {
    providerId?: string
    modelId?: string
}

export interface GenerateChatTitleOptions {
    text: string
    providerId?: string
    modelId?: string
}

export interface ChatActions {
    fetchChats(workspaceId: string): Promise<void>
    createChat(workspaceId: string, dto: ChatDto): Promise<Chat>
    updateChat(workspaceId: string, chatId: string, dto: Partial<ChatDto>): Promise<void>
    deleteChat(workspaceId: string, chatId: string): Promise<void>
    openPendingChat(workspaceId: string, options?: PendingChatOptions): Chat
    updatePendingChat(
        chatId: string,
        patch: { modelId?: string; providerId?: string; thinkingMode?: string; mode?: ChatMode },
    ): void
    commitPendingChat(workspaceId: string, pendingId: string): Promise<Chat>
    discardPendingChat(chatId: string): void
    clearPendingChats(): void
    generateAndApplyChatTitle(
        workspaceId: string,
        chatId: string,
        options: GenerateChatTitleOptions,
    ): Promise<Chat>
}

export function createChatActions(
    storeLogic: ChatStoreLogic,
    businessLogic: ChatBusinessLogic,
): ChatActions {
    async function fetchChats(workspaceId: string): Promise<void> {
        try {
            storeLogic.beginLoad()
            storeLogic.setChats(await businessLogic.list(workspaceId))
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to load chats')
        } finally {
            storeLogic.endLoad()
        }
    }

    async function createChat(workspaceId: string, dto: ChatDto): Promise<Chat> {
        storeLogic.clearError()
        try {
            const chat = await businessLogic.create(workspaceId, dto)
            storeLogic.upsertChat(chat)
            return chat
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to create chat')
            throw e
        }
    }

    async function updateChat(
        workspaceId: string,
        chatId: string,
        dto: Partial<ChatDto>,
    ): Promise<void> {
        storeLogic.clearError()
        try {
            storeLogic.upsertChat(await businessLogic.update(workspaceId, chatId, dto))
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to update chat')
            throw e
        }
    }

    async function deleteChat(workspaceId: string, chatId: string): Promise<void> {
        storeLogic.clearError()
        try {
            await businessLogic.remove(workspaceId, chatId)
            storeLogic.removeChat(chatId)
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to delete chat')
            throw e
        }
    }

    function openPendingChat(workspaceId: string, options?: PendingChatOptions): Chat {
        const now = new Date().toISOString()
        const chat: Chat = {
            id: buildPendingChatId(),
            title: 'New Chat',
            providerId: options?.providerId,
            modelId: options?.modelId,
            mode: 'ask',
            workspaceId,
            createdAt: now,
            updatedAt: now,
        }
        storeLogic.addPending(chat)
        return chat
    }

    function updatePendingChat(
        chatId: string,
        patch: { modelId?: string; providerId?: string; thinkingMode?: string; mode?: ChatMode },
    ): void {
        storeLogic.patchPending(chatId, { ...patch, updatedAt: new Date().toISOString() })
    }

    async function commitPendingChat(workspaceId: string, pendingId: string): Promise<Chat> {
        const pending = storeLogic.getPending(pendingId)
        if (!pending) throw new Error('Pending chat not found')
        storeLogic.clearError()
        try {
            // No title is sent: the backend owns the fallback title.
            // Wait for the backend response before adopting the identity.
            const chat = await businessLogic.create(workspaceId, {
                ...(pending.providerId ? { providerId: pending.providerId } : {}),
                ...(pending.modelId ? { modelId: pending.modelId } : {}),
                ...(pending.thinkingMode ? { thinkingMode: pending.thinkingMode } : {}),
                mode: pending.mode ?? 'ask',
            })
            storeLogic.adoptCommitted(pendingId, chat)
            return chat
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to create chat')
            throw e
        }
    }

    function discardPendingChat(chatId: string): void {
        storeLogic.removePending(chatId)
    }

    function clearPendingChats(): void {
        storeLogic.clearPending()
    }

    async function generateAndApplyChatTitle(
        workspaceId: string,
        chatId: string,
        options: GenerateChatTitleOptions,
    ): Promise<Chat> {
        // Single round trip: the backend generates, persists (AI or fallback)
        // and returns the updated chat. The caller only applies the response.
        const chat = await businessLogic.generateTitle(workspaceId, chatId, {
            text: options.text,
            ...(options.providerId ? { providerId: options.providerId } : {}),
            ...(options.modelId ? { modelId: options.modelId } : {}),
        })
        storeLogic.upsertChat(chat)
        return chat
    }

    return {
        fetchChats,
        createChat,
        updateChat,
        deleteChat,
        openPendingChat,
        updatePendingChat,
        commitPendingChat,
        discardPendingChat,
        clearPendingChats,
        generateAndApplyChatTitle,
    }
}
