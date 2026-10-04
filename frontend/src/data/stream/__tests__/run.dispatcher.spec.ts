import { describe, it, expect, vi } from 'vitest'
import { createRunStreamDispatcher, type EventsOnFn } from '../run.dispatcher'

function createFakeEventsOn() {
    const handlers = new Map<string, Array<(...args: unknown[]) => void>>()
    const eventsOn = vi.fn<EventsOnFn>(((event: string, cb: (...args: unknown[]) => void) => {
        const arr = handlers.get(event) ?? []
        arr.push(cb)
        handlers.set(event, arr)
        return () => {
            const current = handlers.get(event)!
            const idx = current.indexOf(cb)
            if (idx >= 0) current.splice(idx, 1)
        }
    }) as EventsOnFn)
    const emit = (event: string, ...args: unknown[]) => {
        for (const cb of handlers.get(event) ?? []) cb(...args)
    }
    return { eventsOn, emit, handlers }
}

const handlersFor = () => ({
    onChunk: vi.fn<(line: string) => void>(),
    onDone: vi.fn<() => void>(),
    onError: vi.fn<(err: string) => void>(),
})

describe('createRunStreamDispatcher', () => {
    it('routes run events only to the matching watcher', () => {
        const { eventsOn, emit } = createFakeEventsOn()
        const d = createRunStreamDispatcher(eventsOn)
        const a = handlersFor()
        const b = handlersFor()
        d.subscribe('rw-a', a)
        d.subscribe('rw-b', b)

        emit('run:chunk', 'rw-a', '{"seq":1}')
        emit('run:chunk', 'rw-b', '{"seq":1}')
        emit('run:done', 'rw-a')

        expect(a.onChunk).toHaveBeenCalledWith('{"seq":1}')
        expect(b.onChunk).toHaveBeenCalledWith('{"seq":1}')
        expect(a.onDone).toHaveBeenCalledTimes(1)
        expect(b.onDone).not.toHaveBeenCalled()
        d.destroy()
    })

    it('routes run errors to the matching watcher', () => {
        const { eventsOn, emit } = createFakeEventsOn()
        const d = createRunStreamDispatcher(eventsOn)
        const h = handlersFor()
        d.subscribe('rw-a', h)

        emit('run:error', 'rw-a', 'boom')

        expect(h.onError).toHaveBeenCalledWith('boom')
        d.destroy()
    })

    it('unsubscribe stops routing and destroy unregisters channels', () => {
        const { eventsOn, emit } = createFakeEventsOn()
        const d = createRunStreamDispatcher(eventsOn)
        const h = handlersFor()
        const unsub = d.subscribe('rw-a', h)

        unsub()
        emit('run:chunk', 'rw-a', 'gone')
        expect(h.onChunk).not.toHaveBeenCalled()

        d.subscribe('rw-a', h)
        d.destroy()
        emit('run:chunk', 'rw-a', 'after-destroy')
        expect(h.onChunk).not.toHaveBeenCalled()
    })
})
