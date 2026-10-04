import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    createFeedStreamPort,
    resetRunDispatcherGlobal,
    FeedCancelledError,
} from '../feed.transport'
import type { FeedEvent } from '@/core/entities'

const router = vi.hoisted(() => {
    const handlers = new Map<string, Array<(...args: unknown[]) => void>>()
    return {
        handlers,
        emit(event: string, ...args: unknown[]) {
            for (const cb of handlers.get(event) ?? []) cb(...args)
        },
    }
})

const backend = vi.hoisted(() => {
    let seq = 0
    return {
        watchIds: [] as string[],
        unwatchCalls: [] as string[],
        nextId() {
            seq += 1
            return `rw-${seq}`
        },
        reset() {
            seq = 0
            this.watchIds.length = 0
            this.unwatchCalls.length = 0
        },
    }
})

vi.mock('../../../../wailsjs/runtime', () => ({
    EventsOn: (event: string, cb: (...args: unknown[]) => void) => {
        const arr = router.handlers.get(event) ?? []
        arr.push(cb)
        router.handlers.set(event, arr)
        return () => {
            const current = router.handlers.get(event)!
            const idx = current.indexOf(cb)
            if (idx >= 0) current.splice(idx, 1)
        }
    },
}))

vi.mock('../../../../wailsjs/go/stream/RunStreamService', () => ({
    WatchRun: (watchId: string) => {
        backend.watchIds.push(watchId)
        return Promise.resolve()
    },
    UnwatchRun: (watchId: string) => {
        backend.unwatchCalls.push(watchId)
        return Promise.resolve()
    },
}))

function collect() {
    const events: FeedEvent[] = []
    const seqs: number[] = []
    let done = 0
    let error: Error | undefined
    const port = createFeedStreamPort()
    const detach = port.openStream('w', 'c', 'run_1', 0, {
        onEvent: (e) => events.push(e),
        onSeq: (s) => seqs.push(s),
        onDone: () => {
            done += 1
        },
        onError: (e) => {
            error = e
        },
    })
    return {
        events,
        seqs,
        get done() {
            return done
        },
        get error() {
            return error
        },
        detach,
    }
}

beforeEach(() => {
    resetRunDispatcherGlobal()
    router.handlers.clear()
    backend.reset()
    vi.stubGlobal('crypto', {
        ...(globalThis.crypto as object),
        randomUUID: vi.fn<() => string>(() => backend.nextId()),
    })
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('createFeedStreamPort', () => {
    it('forwards feed events raw with seq tracking', () => {
        const c = collect()
        const wid = backend.watchIds[0]!
        router.emit(
            'run:chunk',
            wid,
            '{"type":"text-delta","messageId":"m1","sliceId":"t1","delta":"hi","seq":4}',
        )
        router.emit(
            'run:chunk',
            wid,
            '{"type":"text-delta","messageId":"m1","sliceId":"t1","delta":"!","seq":5}',
        )
        router.emit('run:done', wid)

        expect(c.events).toEqual([
            { type: 'text-delta', messageId: 'm1', sliceId: 't1', delta: 'hi', seq: 4 },
            { type: 'text-delta', messageId: 'm1', sliceId: 't1', delta: '!', seq: 5 },
        ])
        expect(c.seqs).toEqual([4, 5])
        expect(c.done).toBe(1)
        expect(c.error).toBeUndefined()
    })

    it('ignores malformed chunk lines', () => {
        const c = collect()
        const wid = backend.watchIds[0]!
        router.emit('run:chunk', wid, 'not-json')
        router.emit('run:done', wid)
        expect(c.events).toEqual([])
        expect(c.done).toBe(1)
    })

    it('maps run-close cancelled to FeedCancelledError', () => {
        const c = collect()
        const wid = backend.watchIds[0]!
        router.emit('run:error', wid, '{"type":"run-close","runId":"run_1","status":"cancelled"}')
        expect(c.error).toBeInstanceOf(FeedCancelledError)
        expect(c.done).toBe(0)
    })

    it('maps run-close failed to a plain error', () => {
        const c = collect()
        const wid = backend.watchIds[0]!
        router.emit(
            'run:error',
            wid,
            '{"type":"run-close","runId":"run_1","status":"failed","message":"boom"}',
        )
        expect(c.error).toBeInstanceOf(Error)
        expect((c.error as Error).message).toBe('boom')
    })

    it('preserves the backend code on run-close failed', () => {
        const c = collect()
        const wid = backend.watchIds[0]!
        router.emit(
            'run:error',
            wid,
            '{"type":"run-close","runId":"run_1","status":"failed","code":"RATE_LIMITED","message":"Slow down"}',
        )
        expect(c.error).toBeInstanceOf(Error)
        expect((c.error as Error).message).toBe('Slow down')
        expect((c.error as Error & { code?: string }).code).toBe('RATE_LIMITED')
    })

    it('preserves the backend code on oops', () => {
        const c = collect()
        const wid = backend.watchIds[0]!
        router.emit(
            'run:error',
            wid,
            '{"type":"oops","runId":"run_1","code":"UNAUTHORIZED","message":"Bad key"}',
        )
        expect(c.error).toBeInstanceOf(Error)
        expect((c.error as Error & { code?: string }).code).toBe('UNAUTHORIZED')
    })

    it('unwatches on detach (run keeps going server-side)', () => {
        const c = collect()
        const wid = backend.watchIds[0]!
        c.detach()
        expect(backend.unwatchCalls).toEqual([wid])
    })
})
