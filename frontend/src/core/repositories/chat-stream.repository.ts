import type { FeedEvent } from '@/core/entities'

export interface FeedEventHandlers {
    onEvent(event: FeedEvent): void
    onSeq(seq: number): void
    onDone(): void
    onError(err: Error): void
}

export interface FeedStreamPort {
    openStream(
        workspaceId: string,
        chatId: string,
        runId: string,
        afterSeq: number,
        handlers: FeedEventHandlers,
    ): () => void
}
