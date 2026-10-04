import type { HitlStoreLogic } from '../store-logic/hitl.logic'
import type { HitlBusinessLogic } from '../business-logic/hitl.logic'
import type { FEHitlResponse } from '@/core/entities'
import { toMessage } from '@/shared/utils/error.utils'

export interface HitlActions {
    seedPending(): Promise<void>
    startWatch(): void
    stopWatch(): void
    submit(id: string, response: FEHitlResponse): Promise<boolean>
    dismiss(id: string): Promise<boolean>
}

export function createHitlActions(
    storeLogic: HitlStoreLogic,
    businessLogic: HitlBusinessLogic,
): HitlActions {
    let stop: (() => void) | null = null

    async function seedPending(): Promise<void> {
        try {
            const pending = await businessLogic.listPending()
            if (import.meta.env.DEV) {
                console.log(`[hitl] seedPending: ${pending.length} pending request(s)`)
            }
            storeLogic.setPending(pending)
        } catch (e: unknown) {
            if (import.meta.env.DEV) {
                console.log('[hitl] seedPending failed:', toMessage(e))
            }
            storeLogic.setPending([])
        }
    }

    function startWatch(): void {
        if (stop) return
        stop = businessLogic.watch({
            onEvent: (event) => storeLogic.applyEvent(event),
            onError: () => {},
        })
    }

    function stopWatch(): void {
        stop?.()
        stop = null
    }

    async function submit(id: string, response: FEHitlResponse): Promise<boolean> {
        storeLogic.setSubmitting(id, true)
        try {
            const updated = await businessLogic.submit(id, response)
            if (updated && updated.status !== 'pending') {
                storeLogic.remove(id)
            } else {
                storeLogic.setSubmitting(id, false)
            }
            return true
        } catch (e: unknown) {
            storeLogic.setError(id, toMessage(e) || 'Failed to submit response')
            return false
        }
    }

    async function dismiss(id: string): Promise<boolean> {
        storeLogic.setSubmitting(id, true)
        try {
            await businessLogic.cancel(id)
            storeLogic.remove(id)
            return true
        } catch (e: unknown) {
            storeLogic.setError(id, toMessage(e) || 'Failed to dismiss request')
            return false
        }
    }

    return { seedPending, startWatch, stopWatch, submit, dismiss }
}
