import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { FEHitlRequest } from '@/core/entities'

export interface HitlItemState {
    request: FEHitlRequest
    submitting: boolean
    error: string | null
}

function sortKey(request: FEHitlRequest): string {
    return request.createdAt ?? request.id
}

export const useHitlStorer = defineStore('hitl', () => {
    const byId = ref<Record<string, HitlItemState>>({})

    function setPending(requests: FEHitlRequest[]): void {
        const next: Record<string, HitlItemState> = {}
        for (const request of requests) {
            if (request.status !== 'pending') continue
            const item: HitlItemState = byId.value[request.id] ?? {
                request,
                submitting: false,
                error: null,
            }
            item.request = request
            next[request.id] = item
        }
        byId.value = next
    }

    function upsert(request: FEHitlRequest): void {
        if (request.status !== 'pending') {
            remove(request.id)
            return
        }
        const current = byId.value[request.id]
        byId.value[request.id] = {
            request,
            submitting: current?.submitting ?? false,
            error: null,
        }
    }

    function remove(id: string): void {
        delete byId.value[id]
    }

    function setSubmitting(id: string, submitting: boolean): void {
        const current = byId.value[id]
        if (!current) return
        current.submitting = submitting
        if (submitting) current.error = null
    }

    function setError(id: string, message: string): void {
        const current = byId.value[id]
        if (!current) return
        current.error = message
        current.submitting = false
    }

    function clear(): void {
        byId.value = {}
    }

    const pending = computed<HitlItemState[]>(() =>
        Object.values(byId.value).sort((a, b) =>
            sortKey(a.request) < sortKey(b.request) ? -1 : 1,
        ),
    )

    function pendingForChat(chatId: string): HitlItemState[] {
        if (!chatId) return []
        return pending.value.filter((item) => item.request.chatId === chatId)
    }

    return {
        byId,
        pending,
        setPending,
        upsert,
        remove,
        setSubmitting,
        setError,
        clear,
        pendingForChat,
    }
})

export type HitlStorer = ReturnType<typeof useHitlStorer>
