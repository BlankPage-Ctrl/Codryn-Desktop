import type { Chat } from '@/core/entities'
import type { ChatStorer } from '../stores/chat.storer'

export interface ChatStoreLogic {
    beginLoad(): void
    endLoad(): void
    setError(message: string): void
    clearError(): void
    setChats(list: Chat[]): void
    upsertChat(chat: Chat): void
    removeChat(id: string): void
}

export function createChatStoreLogic(getStorer: () => ChatStorer): ChatStoreLogic {
    function beginLoad(): void {
        const storer = getStorer()
        storer.setLoading(true)
        storer.clearError()
    }

    function endLoad(): void {
        getStorer().setLoading(false)
    }

    function setError(message: string): void {
        getStorer().setError(message)
    }

    function clearError(): void {
        getStorer().clearError()
    }

    function setChats(list: Chat[]): void {
        getStorer().setChats(list)
    }

    function upsertChat(chat: Chat): void {
        getStorer().upsertChat(chat)
    }

    function removeChat(id: string): void {
        getStorer().removeChat(id)
    }

    return {
        beginLoad,
        endLoad,
        setError,
        clearError,
        setChats,
        upsertChat,
        removeChat,
    }
}
