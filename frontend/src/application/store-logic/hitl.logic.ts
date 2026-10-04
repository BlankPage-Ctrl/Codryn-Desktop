import { normalizeHitlRequest } from '@/core/entities'
import type { FEHitlEvent, FEHitlRequest } from '@/core/entities'
import type { HitlStorer } from '../stores/hitl.storer'

export interface HitlStoreLogic {
    applyEvent(event: FEHitlEvent): void
    setPending(requests: FEHitlRequest[]): void
    setSubmitting(id: string, submitting: boolean): void
    setError(id: string, message: string): void
    remove(id: string): void
}

export function createHitlStoreLogic(getStorer: () => HitlStorer): HitlStoreLogic {
    function applyEvent(event: FEHitlEvent): void {
        const storer = getStorer()
        switch (event.type) {
            case 'request': {
                const request = normalizeHitlRequest(event.request)
                if (request) storer.upsert(request)
                break
            }
            case 'resolved':
            case 'cancelled':
            case 'expired': {
                const request = normalizeHitlRequest(event.request)
                if (request) storer.remove(request.id)
                break
            }
        }
    }

    return {
        applyEvent,
        setPending: (requests) => getStorer().setPending(requests),
        setSubmitting: (id, submitting) => getStorer().setSubmitting(id, submitting),
        setError: (id, message) => getStorer().setError(id, message),
        remove: (id) => getStorer().remove(id),
    }
}
