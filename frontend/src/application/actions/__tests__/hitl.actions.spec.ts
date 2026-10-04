import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHitlActions } from '../hitl.actions'
import type { HitlBusinessLogic } from '../../business-logic/hitl.logic'
import type { HitlStoreLogic } from '../../store-logic/hitl.logic'
import type { FEHitlEvent, FEHitlRequest, FEHitlResponse } from '@/core/entities'
import type { HitlWatchHandlers } from '@/core/repositories'

function request(id: string): FEHitlRequest {
    return {
        id,
        type: 'approval',
        title: `Shell approval ${id}`,
        description: null,
        correlationId: null,
        workspaceId: null,
        chatId: 'chat-1',
        executionId: null,
        metadata: {},
        status: 'pending',
        createdAt: null,
        expiresAt: null,
        payload: {},
    }
}

function setup() {
    const storeLogic = {
        applyEvent: vi.fn<(event: FEHitlEvent) => void>(),
        setPending: vi.fn<(requests: FEHitlRequest[]) => void>(),
        setSubmitting: vi.fn<(id: string, submitting: boolean) => void>(),
        setError: vi.fn<(id: string, message: string) => void>(),
        remove: vi.fn<(id: string) => void>(),
    } as unknown as HitlStoreLogic

    const stopWatch = vi.fn<() => void>()
    const businessLogic = {
        listPending: vi.fn<() => Promise<FEHitlRequest[]>>(async () => [request('req-1')]),
        submit: vi.fn<(id: string, response: FEHitlResponse) => Promise<FEHitlRequest | null>>(
            async () => ({ ...request('req-1'), status: 'resolved' }),
        ),
        cancel: vi.fn<(id: string) => Promise<void>>(async () => {}),
        watch: vi.fn<(handlers: HitlWatchHandlers) => () => void>(() => stopWatch),
    } as unknown as HitlBusinessLogic

    const actions = createHitlActions(storeLogic, businessLogic)
    return { actions, storeLogic, businessLogic, stopWatch }
}

describe('hitl actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('seeds pending requests and clears them on failure', async () => {
        const { actions, storeLogic, businessLogic } = setup()

        await actions.seedPending()
        expect(storeLogic.setPending).toHaveBeenCalledWith([request('req-1')])

        businessLogic.listPending = vi.fn<() => Promise<FEHitlRequest[]>>(async () => {
            throw new Error('offline')
        })
        await actions.seedPending()
        expect(storeLogic.setPending).toHaveBeenCalledWith([])
    })

    it('starts the watch once and stops it', () => {
        const { actions, businessLogic, stopWatch } = setup()

        actions.startWatch()
        actions.startWatch()
        expect(businessLogic.watch).toHaveBeenCalledTimes(1)

        actions.stopWatch()
        expect(stopWatch).toHaveBeenCalledTimes(1)
    })

    it('removes the card when submit resolves, keeps it when still pending', async () => {
        const { actions, storeLogic, businessLogic } = setup()

        const ok = await actions.submit('req-1', { outcome: 'approved' })
        expect(ok).toBe(true)
        expect(storeLogic.setSubmitting).toHaveBeenCalledWith('req-1', true)
        expect(storeLogic.remove).toHaveBeenCalledWith('req-1')

        businessLogic.submit = vi.fn<
            (id: string, response: FEHitlResponse) => Promise<FEHitlRequest | null>
        >(async () => request('req-1'))
        const stillPending = await actions.submit('req-1', { outcome: 'approved' })
        expect(stillPending).toBe(true)
        expect(storeLogic.setSubmitting).toHaveBeenCalledWith('req-1', false)
    })

    it('stores the error when submit and dismiss fail', async () => {
        const { actions, storeLogic, businessLogic } = setup()

        businessLogic.submit = vi.fn<
            (id: string, response: FEHitlResponse) => Promise<FEHitlRequest | null>
        >(async () => {
            throw new Error('denied')
        })
        expect(await actions.submit('req-1', { outcome: 'approved' })).toBe(false)
        expect(storeLogic.setError).toHaveBeenCalledWith('req-1', 'denied')

        businessLogic.cancel = vi.fn<(id: string) => Promise<void>>(async () => {
            throw new Error('offline')
        })
        expect(await actions.dismiss('req-1')).toBe(false)
        expect(storeLogic.setError).toHaveBeenCalledWith('req-1', 'offline')
    })

    it('removes the card on successful dismiss', async () => {
        const { actions, storeLogic } = setup()

        expect(await actions.dismiss('req-1')).toBe(true)
        expect(storeLogic.remove).toHaveBeenCalledWith('req-1')
    })
})
