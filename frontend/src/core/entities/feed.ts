export type ChatFeedEventName =
    | 'run-open'
    | 'run-close'
    | 'text-open'
    | 'text-delta'
    | 'text-close'
    | 'think-open'
    | 'think-delta'
    | 'think-close'
    | 'work-queued'
    | 'work-active'
    | 'work-ok'
    | 'work-bad'
    | 'stage-open'
    | 'stage-close'
    | 'asset'
    | 'notice'
    | 'oops'

export type FeedRunCloseStatus = 'done' | 'failed' | 'cancelled'

export type FeedAssetKind = 'link' | 'doc' | 'blob'

/** Raw wire/history event: `{ type, ...payload }` with optional `seq` / `role` / `runId`. */
export interface FeedEvent {
    type: ChatFeedEventName
    seq?: number
    runId?: string
    chatId?: string
    messageId?: string
    role?: string
    sliceId?: string
    delta?: string
    callId?: string
    implement?: string
    title?: string
    input?: unknown
    output?: unknown
    errorText?: string
    body?: unknown
    stage?: number
    landed?: string
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
    kind?: FeedAssetKind
    url?: string
    mediaType?: string
    filename?: string
    assistantMessageId?: string
    status?: FeedRunCloseStatus | string
    code?: string
    message?: string
    at?: number
}

export type FeedTextBlock = {
    kind: 'text'
    sliceId: string
    text: string
    closed: boolean
}

export type FeedThinkBlock = {
    kind: 'think'
    sliceId: string
    text: string
    closed: boolean
}

export type FeedWorkState = 'queued' | 'active' | 'ok' | 'bad'

export type FeedWorkBlock = {
    kind: 'work'
    sliceId: string
    callId: string
    implement: string
    title?: string
    state: FeedWorkState
    input?: unknown
    output?: unknown
    errorText?: string
    notices: unknown[]
}

export type FeedAssetBlock = {
    kind: 'asset'
    sliceId: string
    assetKind: FeedAssetKind
    url?: string
    title?: string
    mediaType?: string
    filename?: string
}

export type FeedStageBlock = {
    kind: 'stage'
    stage: number
    landed?: string
}

export type FeedBlock =
    | FeedTextBlock
    | FeedThinkBlock
    | FeedWorkBlock
    | FeedAssetBlock
    | FeedStageBlock

/** Reconstructed bubble: one message groups the blocks of its feed events. */
export interface FeedMessage {
    id: string
    role: 'user' | 'assistant'
    blocks: FeedBlock[]
    runId?: string
}

export function toFeedRole(role: unknown): 'user' | 'assistant' {
    return role === 'user' ? 'user' : 'assistant'
}
