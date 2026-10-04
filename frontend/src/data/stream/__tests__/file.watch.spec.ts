import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fileWatch } from '../file.watch'

const watch = vi.hoisted(() => ({
    startCalls: [] as string[],
    stopCalls: [] as string[],
    resolvers: [] as Array<(id: string) => void>,
    start(workspaceId: string) {
        watch.startCalls.push(workspaceId)
        return new Promise<string>((resolve) => watch.resolvers.push(resolve))
    },
    stop(id: string) {
        watch.stopCalls.push(id)
        return Promise.resolve()
    },
}))

vi.mock('../../../../wailsjs/go/stream/FileWatchService', () => ({
    StartWatch: (workspaceId: string) => watch.start(workspaceId),
    StopWatch: (id: string) => watch.stop(id),
}))

vi.mock('../../../../wailsjs/runtime', () => ({
    EventsOn: () => () => {},
    EventsOff: vi.fn<(eventName: string) => void>(),
}))

describe('fileWatch.createWatchConnection', () => {
    beforeEach(() => {
        watch.startCalls.length = 0
        watch.stopCalls.length = 0
        watch.resolvers.length = 0
    })

    it('starts the watch and stops it on cleanup', async () => {
        const cleanup = fileWatch.createWatchConnection('ws-1', vi.fn())
        expect(watch.startCalls).toEqual(['ws-1'])

        watch.resolvers[0]!('fw-1')
        await vi.waitFor(() => expect(watch.stopCalls).toEqual([]))

        cleanup()
        await vi.waitFor(() => expect(watch.stopCalls).toEqual(['fw-1']))
    })

    it('stops a stream whose StartWatch resolves after cleanup (race fix)', async () => {
        const cleanup = fileWatch.createWatchConnection('ws-1', vi.fn())
        cleanup()

        watch.resolvers[0]!('fw-1')
        await vi.waitFor(() => expect(watch.stopCalls).toEqual(['fw-1']))
    })
})
