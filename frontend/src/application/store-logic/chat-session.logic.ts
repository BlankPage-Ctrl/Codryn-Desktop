import type { ChatSessionState, ChatSessionStorer } from '../stores/chat-session.storer'
import { createEmptyChatSessionState } from '../stores/chat-session.storer'

export interface ChatSessionStoreLogic {
    ensure(chatId: string): void
    patch(chatId: string, patch: Partial<ChatSessionState>): void
    remove(chatId: string): void
    clear(): void
}

export function createChatSessionStoreLogic(
    getStorer: () => ChatSessionStorer,
): ChatSessionStoreLogic {
    function ensure(chatId: string): void {
        const storer = getStorer()
        if (!storer.sessions[chatId]) {
            storer.upsertSession(chatId, createEmptyChatSessionState())
        }
    }

    function patch(chatId: string, patch: Partial<ChatSessionState>): void {
        ensure(chatId)
        getStorer().patchSession(chatId, patch)
    }

    function remove(chatId: string): void {
        getStorer().removeSession(chatId)
    }

    function clear(): void {
        getStorer().clearSessions()
    }

    return {
        ensure,
        patch,
        remove,
        clear,
    }
}
