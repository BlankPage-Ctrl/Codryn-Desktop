import { WatchRun, UnwatchRun } from '../../../wailsjs/go/stream/RunStreamService'
import { EventsOn } from '../../../wailsjs/runtime'
import { createRunStreamDispatcher, type RunStreamDispatcher } from './run.dispatcher'
import type { FeedStreamPort } from '@/core/repositories'
import type { FeedEvent } from '@/core/entities'

const GLOBAL_KEY = '__wailsRunStreamDispatcher__'

/** Terminal `run-close` with status cancelled surfaces as a clean finish. */
export class FeedCancelledError extends Error {
    constructor() {
        super('run cancelled')
        this.name = 'FeedCancelledError'
    }
}

function parseLine(line: string): FeedEvent | null {
    try {
        const parsed = JSON.parse(line) as FeedEvent
        if (parsed && typeof parsed.type === 'string') return parsed
        return null
    } catch {
        return null
    }
}

function errorOf(payload: string): Error {
    const event = parseLine(payload)
    if (event?.type === 'run-close') {
        if (event.status === 'cancelled') return new FeedCancelledError()
        const detail = typeof event.message === 'string' ? event.message : 'run failed'
        return withCode(new Error(detail), event.code)
    }
    if (event?.type === 'oops') {
        const detail = typeof event.message === 'string' ? event.message : 'run failed'
        return withCode(new Error(detail), event.code)
    }
    return new Error(payload)
}

function withCode(err: Error, code: unknown): Error {
    if (typeof code === 'string' && code !== '') {
        ;(err as Error & { code?: string }).code = code
    }
    return err
}

export function createFeedStreamPort(dispatcher?: RunStreamDispatcher): FeedStreamPort {
    const bus = dispatcher ?? getGlobalDispatcher()
    return {
        openStream(workspaceId, chatId, runId, afterSeq, handlers) {
            const watchId = crypto.randomUUID()
            // The Go bridge strips SSE framing (ReadEvent returns the raw
            // payload), so each chunk is already one feed event JSON object.
            const unsubscribe = bus.subscribe(watchId, {
                onChunk: (line) => {
                    const event = parseLine(line)
                    if (!event) return
                    if (typeof event.seq === 'number') handlers.onSeq(event.seq)
                    handlers.onEvent(event)
                },
                onDone: () => handlers.onDone(),
                onError: (err) => handlers.onError(errorOf(err)),
            })
            WatchRun(watchId, workspaceId, chatId, runId, afterSeq).catch((err: Error) => {
                handlers.onError(err)
            })
            return () => {
                unsubscribe()
                UnwatchRun(watchId).catch(() => {})
            }
        },
    }
}

function getGlobalDispatcher(): RunStreamDispatcher {
    const g = globalThis as Record<string, unknown>
    let dispatcher = g[GLOBAL_KEY] as RunStreamDispatcher | undefined
    if (!dispatcher) {
        dispatcher = createRunStreamDispatcher(EventsOn)
        g[GLOBAL_KEY] = dispatcher
    }
    return dispatcher
}

export function resetRunDispatcherGlobal(): void {
    const g = globalThis as Record<string, unknown>
    const dispatcher = g[GLOBAL_KEY] as RunStreamDispatcher | undefined
    if (dispatcher) {
        dispatcher.destroy()
        delete g[GLOBAL_KEY]
    }
}

if (
    import.meta.hot &&
    typeof import.meta.hot.dispose === 'function' &&
    typeof import.meta.hot.accept === 'function'
) {
    import.meta.hot.dispose(() => {
        resetRunDispatcherGlobal()
    })
    import.meta.hot.accept()
}
