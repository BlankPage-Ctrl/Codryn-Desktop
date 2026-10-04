import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { FeedMessage } from '@/core/entities'
import type { ChatSessionStatus } from '@/core/entities'

export interface ChatSessionState {
    messages: FeedMessage[]
    status: ChatSessionStatus
    error: Error | undefined
    isLoading: boolean
    activeRunId: string | undefined
}

export function createEmptyChatSessionState(): ChatSessionState {
    return {
        messages: [],
        status: 'ready',
        error: undefined,
        isLoading: false,
        activeRunId: undefined,
    }
}

export const useChatSessionStorer = defineStore('chat-session', () => {
    const sessions = ref<Record<string, ChatSessionState>>({})

    function upsertSession(chatId: string, state: ChatSessionState): void {
        sessions.value[chatId] = state
    }

    function patchSession(chatId: string, patch: Partial<ChatSessionState>): void {
        const current = sessions.value[chatId]
        if (!current) return
        sessions.value[chatId] = { ...current, ...patch }
    }

    function removeSession(chatId: string): void {
        delete sessions.value[chatId]
    }

    function clearSessions(): void {
        sessions.value = {}
    }

    return {
        sessions,
        upsertSession,
        patchSession,
        removeSession,
        clearSessions,
    }
})

export type ChatSessionStorer = ReturnType<typeof useChatSessionStorer>
