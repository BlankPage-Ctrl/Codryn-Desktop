import type { ChatStoreLogic } from '../store-logic/chat.logic'
import type { ChatBusinessLogic } from '../business-logic/chat.logic'
import type { ChatDto } from '@/core/entities'
import { toMessage } from '@/shared/utils/error.utils'

export interface ChatActions {
    fetchChats(workspaceId: string): Promise<void>
    createChat(workspaceId: string, dto: ChatDto): Promise<void>
    updateChat(workspaceId: string, chatId: string, dto: Partial<ChatDto>): Promise<void>
    deleteChat(workspaceId: string, chatId: string): Promise<void>
}

export function createChatActions(
    storeLogic: ChatStoreLogic,
    businessLogic: ChatBusinessLogic,
): ChatActions {
    async function fetchChats(workspaceId: string): Promise<void> {
        storeLogic.beginLoad()
        try {
            storeLogic.setChats(await businessLogic.list(workspaceId))
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to load chats')
        } finally {
            storeLogic.endLoad()
        }
    }

    async function createChat(workspaceId: string, dto: ChatDto): Promise<void> {
        storeLogic.clearError()
        try {
            storeLogic.upsertChat(await businessLogic.create(workspaceId, dto))
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

    return {
        fetchChats,
        createChat,
        updateChat,
        deleteChat,
    }
}
