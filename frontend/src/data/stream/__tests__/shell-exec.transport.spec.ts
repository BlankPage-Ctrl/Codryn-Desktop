import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shellExec } from '../shell-exec.transport'

const bridge = vi.hoisted(() => {
    const events: Record<string, (...data: unknown[]) => void> = {}
    return {
        startCalls: [] as string[],
        stopCalls: [] as string[],
        resolvers: [] as Array<(id: string) => void>,
        events,
        start(workspaceId: string) {
            bridge.startCalls.push(workspaceId)
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

vi.mock('../../../../wailsjs/go/stream/ShellExecWatchService', () => ({
    StartWatch: (workspaceId: string) => bridge.start(workspaceId),
    StopWatch: (id: string) => bridge.stop(id),
}))

vi.mock('../../../../wailsjs/runtime', () => ({
    EventsOn: (event: string, cb: (...data: unknown[]) => void) => bridge.on(event, cb),
    EventsOff: (event: string) => bridge.off(event),
}))

describe('shellExec.watch', () => {
    beforeEach(() => {
        bridge.startCalls.length = 0
        bridge.stopCalls.length = 0
        bridge.resolvers.length = 0
        for (const k of Object.keys(bridge.events)) delete bridge.events[k]
    })

    it('starts the watch and forwards shell events by stream id', async () => {
        const onEvent = vi.fn<(...args: unknown[]) => void>()
        const cleanup = shellExec.watch('ws-1', { onEvent })

        expect(bridge.startCalls).toEqual(['ws-1'])

        bridge.resolvers[0]!('se-1')
        await vi.waitFor(() => expect(bridge.events['shell:chunk']).toBeDefined())

        bridge.events['shell:chunk']!(
            'se-1',
            JSON.stringify({
                type: 'chunk',
                executionId: 'e1',
                toolCallId: 't1',
                workspaceId: 'ws-1',
                stream: 'stdout',
                text: 'hi',
                at: 1,
            }),
        )
        expect(onEvent).toHaveBeenCalledTimes(1)
        expect(onEvent.mock.calls[0]![0]).toMatchObject({ type: 'chunk', text: 'hi' })

        cleanup()
        await vi.waitFor(() => expect(bridge.stopCalls).toEqual(['se-1']))
    })

    it('ignores events from a different stream id', async () => {
        const onEvent = vi.fn<(...args: unknown[]) => void>()
        const cleanup = shellExec.watch('ws-1', { onEvent })
        bridge.resolvers[0]!('se-1')
        await vi.waitFor(() => expect(bridge.events['shell:chunk']).toBeDefined())

        bridge.events['shell:chunk']!('OTHER', JSON.stringify({ type: 'chunk', text: 'x', at: 1 }))
        expect(onEvent).not.toHaveBeenCalled()

        cleanup()
        await vi.waitFor(() => expect(bridge.stopCalls).toEqual(['se-1']))
    })

    it('stops a stream whose StartWatch resolves after cleanup', async () => {
        const onEvent = vi.fn<(...args: unknown[]) => void>()
        const cleanup = shellExec.watch('ws-1', { onEvent })
        cleanup()

        bridge.resolvers[0]!('se-1')
        await vi.waitFor(() => expect(bridge.stopCalls).toEqual(['se-1']))
    })
})
