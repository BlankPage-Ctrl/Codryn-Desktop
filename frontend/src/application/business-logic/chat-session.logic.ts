import type { FeedStreamPort, MessageRepository, RunRepository } from '@/core/repositories'
import type {
    ChatImageAttachment,
    ChatSessionStatus,
    FeedEvent,
    FeedMessage,
    RevertFileRestore,
    RevertPreview,
} from '@/core/entities'
import { applyFeedEvent } from './feed.reducer'
import { FeedCancelledError } from '@/data/stream'

export interface ChatSessionStatePatch {
    messages?: FeedMessage[]
    status?: ChatSessionStatus
    error?: Error | undefined
    isLoading?: boolean
    activeRunId?: string | undefined
}

export interface ChatSessionDeps {
    messagesRepo: MessageRepository
    runsRepo: RunRepository
    stream: FeedStreamPort
    onState: (chatId: string, patch: ChatSessionStatePatch) => void
}

export interface SendEditResult {
    ok: boolean
    fileRestore?: RevertFileRestore
}

export interface ChatSessionEngine {
    loadHistory(workspaceId: string, chatId: string): Promise<void>
    sendMessage(
        workspaceId: string,
        chatId: string,
        text: string,
        attachments?: ChatImageAttachment[],
    ): Promise<void>
    beginEdit(chatId: string, messageId: string): string | null
    /**
     * Read-only revert preview for the edit banner. Never throws: a failed
     * preview resolves to null and the banner falls back to no file info.
     */
    previewEdit(
        workspaceId: string,
        chatId: string,
        messageId: string,
    ): Promise<RevertPreview | null>
    sendEdit(
        workspaceId: string,
        chatId: string,
        messageId: string,
        text: string,
        opts?: { restoreFiles?: boolean },
    ): Promise<SendEditResult>
    stop(chatId: string): Promise<void>
    dispose(chatId: string): void
    clear(): void
}

interface ActiveWatch {
    workspaceId: string
    runId: string
    detach: () => void
}

function withCode(err: Error, code: unknown): Error {
    if (typeof code === 'string' && code !== '') {
        ;(err as Error & { code?: string }).code = code
    }
    return err
}

export function createChatSessionEngine(deps: ChatSessionDeps): ChatSessionEngine {
    const cache = new Map<string, FeedMessage[]>()
    const watches = new Map<string, ActiveWatch>()
    const loaded = new Set<string>()
    const pendingFrames = new Map<string, number>()

    function patchMessages(chatId: string, messages: FeedMessage[]): void {
        cancelCoalesced(chatId)
        cache.set(chatId, messages)
        deps.onState(chatId, { messages: [...messages] })
    }

    function cancelCoalesced(chatId: string): void {
        const id = pendingFrames.get(chatId)
        if (id === undefined) return
        pendingFrames.delete(chatId)
        if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id)
    }

    function flushCoalesced(chatId: string): void {
        if (!pendingFrames.has(chatId)) return
        cancelCoalesced(chatId)
        const messages = cache.get(chatId)
        if (messages) deps.onState(chatId, { messages: [...messages] })
    }

    function scheduleCoalesced(chatId: string): void {
        if (pendingFrames.has(chatId)) return
        if (typeof requestAnimationFrame !== 'function') {
            // Non-DOM environments (tests/SSR): preserve synchronous behavior.
            const messages = cache.get(chatId)
            if (messages) deps.onState(chatId, { messages: [...messages] })
            return
        }
        const id = requestAnimationFrame(() => {
            // A flush/cancel for a newer event supersedes this frame.
            if (pendingFrames.get(chatId) !== id) return
            pendingFrames.delete(chatId)
            const messages = cache.get(chatId)
            if (messages) deps.onState(chatId, { messages: [...messages] })
        })
        pendingFrames.set(chatId, id)
    }

    function applyEvent(chatId: string, event: FeedEvent): void {
        const prev = cache.get(chatId) ?? []
        const next = applyFeedEvent(prev, event)
        if (next !== prev) {
            if (event.type === 'text-delta' || event.type === 'think-delta') {
                cache.set(chatId, next)
                scheduleCoalesced(chatId)
            } else {
                patchMessages(chatId, next)
            }
        }
        if (event.type === 'oops') {
            const detail = typeof event.message === 'string' ? event.message : 'Run failed'
            flushCoalesced(chatId)
            deps.onState(chatId, {
                error: withCode(new Error(detail), event.code),
                status: 'error',
                isLoading: false,
                activeRunId: undefined,
            })
            watches.delete(chatId)
        }
        if (event.type === 'run-close') {
            flushCoalesced(chatId)
            finishWatch(
                chatId,
                event.status,
                typeof event.message === 'string' ? event.message : undefined,
                typeof event.code === 'string' ? event.code : undefined,
            )
        }
    }

    function finishWatch(chatId: string, status: unknown, message?: string, code?: string): void {
        const watch = watches.get(chatId)
        if (watch) {
            watch.detach()
            watches.delete(chatId)
        }
        if (status === 'failed') {
            deps.onState(chatId, {
                error: withCode(new Error(message || 'Run failed'), code),
                status: 'error',
                isLoading: false,
                activeRunId: undefined,
            })
        } else {
            // done + cancelled both settle cleanly; stop() already patched
            // its own state, so only fill in when still loading.
            deps.onState(chatId, { status: 'ready', isLoading: false, activeRunId: undefined })
        }
    }

    function attach(workspaceId: string, chatId: string, runId: string, afterSeq: number): void {
        const prev = watches.get(chatId)
        if (prev) {
            prev.detach()
            watches.delete(chatId)
        }
        deps.onState(chatId, {
            status: 'streaming',
            isLoading: true,
            activeRunId: runId,
            error: undefined,
        })
        const detach = deps.stream.openStream(workspaceId, chatId, runId, afterSeq, {
            onEvent: (event) => applyEvent(chatId, event),
            onSeq: () => {},
            onDone: () => finishWatch(chatId, 'done'),
            onError: (err) => {
                if (err instanceof FeedCancelledError) {
                    finishWatch(chatId, 'cancelled')
                    return
                }
                const watch = watches.get(chatId)
                if (watch) {
                    watch.detach()
                    watches.delete(chatId)
                }
                deps.onState(chatId, {
                    error: err,
                    status: 'error',
                    isLoading: false,
                    activeRunId: undefined,
                })
            },
        })
        watches.set(chatId, { workspaceId, runId, detach })
    }

    async function loadHistory(workspaceId: string, chatId: string): Promise<void> {
        if (loaded.has(chatId)) return
        loaded.add(chatId)
        try {
            const history = await deps.messagesRepo.loadHistory(workspaceId, chatId)
            let messages: FeedMessage[] = []
            for (const event of history ?? []) {
                messages = applyFeedEvent(messages, event)
            }
            patchMessages(chatId, messages)
            deps.onState(chatId, { status: 'ready', isLoading: false })

            // Reattach to a still-running run: replay is final DB state,
            // the live tail rebuilds on top of it from seq 0.
            const runs = await deps.runsRepo.list(workspaceId, chatId).catch(() => [])
            const running = (runs ?? []).filter((r) => r.status === 'running')
            const target = running[0]
            if (target) {
                attach(workspaceId, chatId, target.runId, 0)
            }
        } catch (e: unknown) {
            deps.onState(chatId, {
                error: e instanceof Error ? e : new Error('Failed to load messages'),
            })
        }
    }

    async function sendMessage(
        workspaceId: string,
        chatId: string,
        text: string,
        attachments: ChatImageAttachment[] = [],
    ): Promise<void> {
        const ready = attachments.filter((a) => a.attachmentId !== '')
        if (!text.trim() && ready.length === 0) return
        const parts: Array<Record<string, unknown>> = []
        if (text.trim() !== '') parts.push({ type: 'text', text })
        for (const a of ready) {
            parts.push({
                type: 'file',
                mediaType: a.mediaType,
                url: `attachment://${a.attachmentId}`,
                ...(a.filename ? { filename: a.filename } : {}),
            })
        }
        const userMessage: FeedMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            blocks: [
                ...(text.trim() !== ''
                    ? [{ kind: 'text', sliceId: crypto.randomUUID(), text, closed: true } as const]
                    : []),
                ...ready.map(
                    (a) =>
                        ({
                            kind: 'asset',
                            sliceId: crypto.randomUUID(),
                            assetKind: 'blob',
                            url: a.previewUrl ?? `attachment://${a.attachmentId}`,
                            mediaType: a.mediaType,
                            ...(a.filename ? { filename: a.filename } : {}),
                        }) as const,
                ),
            ],
        }
        patchMessages(chatId, [...(cache.get(chatId) ?? []), userMessage])
        deps.onState(chatId, { error: undefined, isLoading: true, status: 'submitted' })
        try {
            const started = await deps.runsRepo.start(workspaceId, chatId, {
                id: userMessage.id,
                role: 'user',
                parts,
            })
            attach(workspaceId, chatId, started.runId, 0)
        } catch (e: unknown) {
            deps.onState(chatId, {
                error: e instanceof Error ? e : new Error('Failed to send message'),
                status: 'error',
                isLoading: false,
            })
        }
    }

    function beginEdit(chatId: string, messageId: string): string | null {
        // Read-only: never touches the running watch. The live run keeps
        // going until the user confirms with sendEdit (or cancels the draft).
        const msg = (cache.get(chatId) ?? []).find((m) => m.id === messageId)
        if (!msg || msg.role !== 'user') return null
        const text = msg.blocks.map((b) => (b.kind === 'text' ? b.text : '')).join('')
        return text
    }

    async function previewEdit(
        workspaceId: string,
        chatId: string,
        messageId: string,
    ): Promise<RevertPreview | null> {
        try {
            return await deps.messagesRepo.previewRevert(workspaceId, chatId, messageId)
        } catch {
            return null
        }
    }

    async function sendEdit(
        workspaceId: string,
        chatId: string,
        messageId: string,
        text: string,
        opts?: { restoreFiles?: boolean },
    ): Promise<SendEditResult> {
        if (!text.trim()) return { ok: false }
        // Revert first, detach after. The backend cancel settles the live
        // stream on its own (run-close => FeedCancelledError => finishWatch
        // detaches); the detach below is only local cleanup. Never detach
        // before revert resolves - a failed revert must leave the live
        // stream untouched so the user keeps watching it.
        deps.onState(chatId, { error: undefined, isLoading: true, status: 'submitted' })
        let deletedIds: string[] | null = null
        let fileRestore: RevertFileRestore | undefined
        try {
            const result = await deps.messagesRepo.revert(
                workspaceId,
                chatId,
                messageId,
                opts?.restoreFiles ?? false,
            )
            deletedIds = result?.deletedMessageIds ?? null
            fileRestore = result?.fileRestore
        } catch (e: unknown) {
            const err = e instanceof Error ? e : new Error('Failed to revert message')
            if (watches.has(chatId)) {
                // Stream still alive - keep watching, just surface the error.
                deps.onState(chatId, { error: err, status: 'streaming', isLoading: true })
            } else {
                deps.onState(chatId, { error: err, status: 'error', isLoading: false })
            }
            return { ok: false }
        }
        const watch = watches.get(chatId)
        if (watch) {
            watch.detach()
            watches.delete(chatId)
        }
        cancelCoalesced(chatId)
        // Surgical tail-drop: the backend deleted the edited user message
        // plus everything after it and told us exactly which ids are gone.
        // Filter them out of the local cache instead of refetching the full
        // history. Full reload stays as the fallback for inconsistent
        // results (target id not reported back).
        if (deletedIds !== null && deletedIds.includes(messageId)) {
            const gone = new Set(deletedIds)
            const prev = cache.get(chatId) ?? []
            patchMessages(
                chatId,
                prev.filter((m) => !gone.has(m.id)),
            )
        } else {
            // Drop the reverted tail locally and rebuild from source of truth,
            // then send the edited prompt as a fresh run.
            cache.delete(chatId)
            loaded.delete(chatId)
            await loadHistory(workspaceId, chatId)
        }
        await sendMessage(workspaceId, chatId, text)
        return fileRestore === undefined ? { ok: true } : { ok: true, fileRestore }
    }

    async function stop(chatId: string): Promise<void> {
        const watch = watches.get(chatId)
        if (watch) {
            // Cancel server-side (kills the agent). The `run-close`
            // terminal frame settles the stream; detach only unwatches.
            try {
                await deps.runsRepo.cancel(watch.workspaceId, chatId, watch.runId)
            } catch (e: unknown) {
                deps.onState(chatId, {
                    error: e instanceof Error ? e : new Error('Failed to cancel run'),
                })
            }
        }
        const active = watches.get(chatId)
        if (active) {
            active.detach()
            watches.delete(chatId)
        }
        deps.onState(chatId, { status: 'ready', isLoading: false, activeRunId: undefined })
    }

    function detach(chatId: string): void {
        // Closing a tab only detaches the local watcher - the run keeps
        // going on the backend and can be resumed later.
        const watch = watches.get(chatId)
        if (watch) {
            watch.detach()
            watches.delete(chatId)
        }
        cancelCoalesced(chatId)
        loaded.delete(chatId)
    }

    function dispose(chatId: string): void {
        detach(chatId)
    }

    function clear(): void {
        for (const chatId of watches.keys()) {
            detach(chatId)
        }
        for (const chatId of pendingFrames.keys()) {
            cancelCoalesced(chatId)
        }
        cache.clear()
        loaded.clear()
    }

    return { loadHistory, sendMessage, beginEdit, previewEdit, sendEdit, stop, dispose, clear }
}
