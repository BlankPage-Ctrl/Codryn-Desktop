import type { FEHitlEvent, FEHitlRequest, FEHitlResponse } from '@/core/entities'

export interface HitlWatchHandlers {
    onEvent: (event: FEHitlEvent) => void
    onError?: (error: Event) => void
}

export interface HitlRepository {
    listPending(): Promise<FEHitlRequest[]>
    getById(id: string): Promise<FEHitlRequest | null>
    submitResponse(id: string, response: FEHitlResponse): Promise<FEHitlRequest | null>
    cancel(id: string): Promise<void>
}

export interface HitlWatchPort {
    watch(handlers: HitlWatchHandlers): () => void
}
