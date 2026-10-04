export interface RunStreamEventHandlers {
    onChunk(line: string): void
    onDone(): void
    onError(err: string): void
}

export interface RunStreamDispatcher {
    subscribe(watchId: string, handlers: RunStreamEventHandlers): () => void
    destroy(): void
}

export type EventsOnFn = (event: string, callback: (...data: unknown[]) => void) => () => void

const CHUNK_EVENT = 'run:chunk'
const DONE_EVENT = 'run:done'
const ERROR_EVENT = 'run:error'

export function createRunStreamDispatcher(eventsOn: EventsOnFn): RunStreamDispatcher {
    const listeners = new Map<string, RunStreamEventHandlers>()

    const route =
        (kind: 'chunk' | 'done' | 'error') =>
        (...data: unknown[]): void => {
            const watchId = data[0] as string
            const handler = listeners.get(watchId)
            if (!handler) return
            if (kind === 'chunk') handler.onChunk(data[1] as string)
            else if (kind === 'done') handler.onDone()
            else handler.onError(data[1] as string)
        }

    const unsubscribes = [
        eventsOn(CHUNK_EVENT, route('chunk')),
        eventsOn(DONE_EVENT, route('done')),
        eventsOn(ERROR_EVENT, route('error')),
    ]

    const subscribe = (watchId: string, handlers: RunStreamEventHandlers): (() => void) => {
        listeners.set(watchId, handlers)
        return () => {
            listeners.delete(watchId)
        }
    }

    const destroy = (): void => {
        unsubscribes.forEach((unsub) => unsub())
        listeners.clear()
    }

    return { subscribe, destroy }
}
