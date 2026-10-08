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
    getPending(id: string): Chat | undefined
    addPending(chat: Chat): void
    patchPending(id: string, patch: Partial<Chat>): void
    adoptCommitted(pendingId: string, chat: Chat): void
    removePending(id: string): void
    clearPending(): void
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

    function getPending(id: string): Chat | undefined {
        return getStorer().pending[id]
    }

    function addPending(chat: Chat): void {
        getStorer().setPending(chat)
    }

    function patchPending(id: string, patch: Partial<Chat>): void {
        getStorer().patchPending(id, patch)
    }

    function adoptCommitted(pendingId: string, chat: Chat): void {
        const storer = getStorer()
        storer.removePending(pendingId)
        storer.upsertChat(chat)
    }

    function removePending(id: string): void {
        getStorer().removePending(id)
    }

    function clearPending(): void {
        getStorer().clearPending()
    }

    return {
        beginLoad,
        endLoad,
        setError,
        clearError,
        setChats,
        upsertChat,
        removeChat,
        getPending,
        addPending,
        patchPending,
        adoptCommitted,
        removePending,
        clearPending,
    }
}
