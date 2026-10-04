import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hitlWatch } from '../hitl.transport'

const bridge = vi.hoisted(() => {
    const events: Record<string, (...data: unknown[]) => void> = {}
    return {
        startCalls: [] as unknown[],
        stopCalls: [] as string[],
        resolvers: [] as Array<(id: string) => void>,
        events,
        start() {
            bridge.startCalls.push(undefined)
            return new Promise<string>((resolve) => bridge.resolvers.push(resolve))
        },
        stop(id: string) {
            bridge.stopCalls.push(id)
            return Promise.resolve()
        },
        on(event: string, cb: (...data: unknown[]) => void) {
            bridge.events[event] = cb
            return () => {}
        },
        off: vi.fn<(event: string) => void>(),
    }
})

vi.mock('../../../../wailsjs/go/stream/HitlWatchService', () => ({
    StartWatch: () => bridge.start(),
    StopWatch: (id: string) => bridge.stop(id),
}))

vi.mock('../../../../wailsjs/runtime', () => ({
    EventsOn: (event: string, cb: (...data: unknown[]) => void) => bridge.on(event, cb),
    EventsOff: (event: string) => bridge.off(event),
}))

function frame(type: string, id: string) {
    return JSON.stringify({
        type,
        request: {
            id,
            type: 'approval',
            title: `Shell approval ${id}`,
            description: null,
            correlationId: null,
            workspaceId: 'ws-1',
            chatId: 'chat-1',
            executionId: null,
            metadata: {},
            status: 'pending',
            createdAt: null,
            expiresAt: null,
            payload: {},
            response: null,
        },
    })
}

describe('hitlWatch.watch', () => {
    beforeEach(() => {
        bridge.startCalls.length = 0
        bridge.stopCalls.length = 0
        bridge.resolvers.length = 0
        for (const k of Object.keys(bridge.events)) delete bridge.events[k]
    })

    it('forwards single-arg typed events (no stream id from Go)', async () => {
        const onEvent = vi.fn<(...args: unknown[]) => void>()
        const cleanup = hitlWatch.watch({ onEvent })

        bridge.resolvers[0]!('hitl-1')
        await vi.waitFor(() => expect(bridge.events['hitl:request']).toBeDefined())

        // Go emits EventsEmit(ctx, "hitl:request", string(event)) — one arg.
        bridge.events['hitl:request']!(frame('request', 'req-1'))
        expect(onEvent).toHaveBeenCalledTimes(1)
        expect(onEvent.mock.calls[0]![0]).toMatchObject({ type: 'request' })

        bridge.events['hitl:resolved']!(frame('resolved', 'req-1'))
        expect(onEvent).toHaveBeenCalledTimes(2)
        expect(onEvent.mock.calls[1]![0]).toMatchObject({ type: 'resolved' })

        cleanup()
        await vi.waitFor(() => expect(bridge.stopCalls).toEqual(['hitl-1']))
    })

    it('ignores non-JSON frames', async () => {
        const onEvent = vi.fn<(...args: unknown[]) => void>()
        const cleanup = hitlWatch.watch({ onEvent })

        bridge.resolvers[0]!('hitl-1')
        await vi.waitFor(() => expect(bridge.events['hitl:expired']).toBeDefined())

        bridge.events['hitl:expired']!('not-json')
        bridge.events['hitl:expired']!(JSON.stringify({ type: 'heartbeat' }))
        expect(onEvent).not.toHaveBeenCalled()

        cleanup()
        await vi.waitFor(() => expect(bridge.stopCalls).toEqual(['hitl-1']))
    })

    it('forwards watch errors and stops a late-resolving watch', async () => {
        const onError = vi.fn<(...args: unknown[]) => void>()
        const cleanup = hitlWatch.watch({ onEvent: () => {}, onError })

        bridge.resolvers[0]!('hitl-1')
        await vi.waitFor(() => expect(bridge.events['hitl:watch-error']).toBeDefined())

        bridge.events['hitl:watch-error']!('hitl-1', 'stream ended')
        expect(onError).toHaveBeenCalledTimes(1)

        bridge.events['hitl:watch-error']!('other-stream', 'stale')
        expect(onError).toHaveBeenCalledTimes(1)

        cleanup()
        await vi.waitFor(() => expect(bridge.stopCalls).toEqual(['hitl-1']))
    })
})
