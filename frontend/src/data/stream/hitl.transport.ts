import { StartWatch, StopWatch } from '../../../wailsjs/go/stream/HitlWatchService'
import { EventsOn, EventsOff } from '../../../wailsjs/runtime'
import { parseHitlEvent } from '@/core/entities'
import type { FEHitlEvent } from '@/core/entities'
import type { HitlWatchHandlers, HitlWatchPort } from '@/core/repositories'

const EVENT_TYPES = ['hitl:request', 'hitl:resolved', 'hitl:cancelled', 'hitl:expired'] as const

function toEvent(raw: string): FEHitlEvent | null {
    return parseHitlEvent(raw)
}

/**
 * Global HITL watch (no workspace scoping — the backend SSE stream is global).
 * Consumers filter by `chatId` from the request payload.
 *
 * NOTE: unlike the shell watch, `HitlWatchService` emits typed events with a
 * single data arg (the raw JSON frame, no stream id). Only `hitl:watch-error`
 * carries `(streamId, message)`. The router below accepts both shapes.
 */
export const hitlWatch: HitlWatchPort = {
    watch(handlers: HitlWatchHandlers): () => void {
        let streamId: string | null = null
        let active = true
        const cleanup: (() => void)[] = []

        const route = (...args: unknown[]) => {
            if (!active) return
            for (const arg of args) {
                if (typeof arg !== 'string') continue
                const event = toEvent(arg)
                if (event) {
                    if (import.meta.env.DEV) {
                        console.debug('[hitl] watch event:', event.type, arg.slice(0, 300))
                    }
                    handlers.onEvent(event)
                    return
                }
            }
            if (import.meta.env.DEV) {
                console.debug('[hitl] ignored frame:', ...args)
            }
        }

        for (const type of EVENT_TYPES) {
            cleanup.push(EventsOn(type, route))
        }
        cleanup.push(
            EventsOn('hitl:watch-error', (...args: unknown[]) => {
                if (!active) return
                const sid = args.find((arg): arg is string => typeof arg === 'string')
                if (streamId !== null && sid !== undefined && sid !== streamId) return
                if (import.meta.env.DEV) {
                    console.debug('[hitl] watch error:', ...args)
                }
                handlers.onError?.(new Event('hitl-watch-error'))
            }),
        )

        StartWatch().then((id) => {
            if (!active) {
                StopWatch(id)
                return
            }
            streamId = id
        })

        return () => {
            active = false
            cleanup.forEach((fn) => fn())
            for (const type of EVENT_TYPES) {
                EventsOff(type)
            }
            EventsOff('hitl:watch-error')
            if (streamId) StopWatch(streamId)
        }
    },
}
