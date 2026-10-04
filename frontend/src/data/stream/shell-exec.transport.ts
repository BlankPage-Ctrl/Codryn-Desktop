import { StartWatch, StopWatch } from '../../../wailsjs/go/stream/ShellExecWatchService'
import { EventsOn, EventsOff } from '../../../wailsjs/runtime'
import type { FEShellExecEvent } from '@/core/entities'
import type { ShellExecPort, ShellExecWatchHandlers } from '@/core/repositories'

const EVENT_TYPES = ['shell:start', 'shell:chunk', 'shell:done', 'shell:error'] as const

function toEvent(raw: string): FEShellExecEvent | null {
    try {
        return JSON.parse(raw) as FEShellExecEvent
    } catch {
        return null
    }
}

export const shellExec: ShellExecPort = {
    watch(workspaceId: string, handlers: ShellExecWatchHandlers): () => void {
        let streamId: string | null = null
        let active = true
        let cleanup: (() => void)[] = []

        const route = (sid: string, raw: string) => {
            if (!active || sid !== streamId) return
            const event = toEvent(raw)
            if (event) handlers.onEvent(event)
        }

        cleanup = EVENT_TYPES.map((type) => EventsOn(type, route))
        cleanup.push(
            EventsOn('shell:watch-error', (sid: string) => {
                if (!active || sid !== streamId) return
                handlers.onError?.(new Event('shell-watch-error'))
            }),
        )

        StartWatch(workspaceId).then((id) => {
            if (!active) {
                StopWatch(id)
                return
            }
            streamId = id
        })

        return () => {
            active = false
            cleanup.forEach((fn) => fn())
            EVENT_TYPES.forEach((type) => EventsOff(type))
            EventsOff('shell:watch-error')
            if (streamId) StopWatch(streamId)
        }
    },
}
