import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Chat } from '@/core/entities'

export const useChatStorer = defineStore('chat', () => {
    const chats = ref<Chat[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    function setChats(list: Chat[]): void {
        chats.value = list
    }

    function setLoading(v: boolean): void {
        loading.value = v
    }

    function setError(message: string | null): void {
        error.value = message
    }

    function clearError(): void {
        error.value = null
    }

    function upsertChat(chat: Chat): void {
        const idx = chats.value.findIndex((c) => c.id === chat.id)
        if (idx === -1) {
            chats.value.push(chat)
        } else {
            chats.value[idx] = { ...chats.value[idx], ...chat }
        }
    }

    function removeChat(id: string): void {
        chats.value = chats.value.filter((c) => c.id !== id)
    }

    return {
        chats,
        loading,
        error,
        setChats,
        setLoading,
        setError,
        clearError,
        upsertChat,
        removeChat,
    }
})

export type ChatStorer = ReturnType<typeof useChatStorer>
