import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useHitlStorer } from '../../stores/hitl.storer'
import { createHitlStoreLogic } from '../hitl.logic'
import { normalizeHitlRequest, parseHitlEvent } from '@/core/entities'

function approvalRequest(id: string, chatId: string) {
    return {
        id,
        type: 'approval',
        title: `Shell approval: ls ${id}`,
        description: 'Command requires manual approval',
        correlationId: null,
        workspaceId: 'ws-1',
        chatId,
        executionId: `tool-${id}`,
        metadata: { source: 'shell', command: 'ls', cwd: '/tmp' },
        status: 'pending',
        createdAt: '2026-09-07T00:00:00.000Z',
        updatedAt: '2026-09-07T00:00:00.000Z',
        expiresAt: '2026-09-07T00:05:00.000Z',
        resolvedAt: null,
        payload: {
            contextPreview: { command: 'ls', cwd: '/tmp' },
        },
        response: null,
    }
}

describe('normalizeHitlRequest', () => {
    it('normalizes a shell approval request', () => {
        const request = normalizeHitlRequest(approvalRequest('req-1', 'chat-1'))
        expect(request?.id).toBe('req-1')
        expect(request?.type).toBe('approval')
        expect(request?.chatId).toBe('chat-1')
        expect(request?.metadata.command).toBe('ls')
        expect(request?.payload.contextPreview).toEqual({ command: 'ls', cwd: '/tmp' })
    })

    it('parses a base64 payload', () => {
        const payload = btoa(JSON.stringify({ contextPreview: { command: 'pwd' } }))
        const request = normalizeHitlRequest({ ...approvalRequest('req-2', 'chat-1'), payload })
        expect(request?.payload.contextPreview).toEqual({ command: 'pwd' })
    })

    it('rejects unknown types and missing ids', () => {
        expect(normalizeHitlRequest({ type: 'approval' })).toBeNull()
        expect(normalizeHitlRequest({ id: 'x', type: 'unknown' })).toBeNull()
        expect(normalizeHitlRequest(null)).toBeNull()
    })
})

describe('parseHitlEvent', () => {
    it('parses request/resolved envelopes and ignores unknown frames', () => {
        const request = approvalRequest('req-1', 'chat-1')
        expect(parseHitlEvent(JSON.stringify({ type: 'request', request }))?.type).toBe('request')
        expect(
            parseHitlEvent(JSON.stringify({ type: 'resolved', request, response: {} }))?.type,
        ).toBe('resolved')
        expect(parseHitlEvent(JSON.stringify({ type: 'heartbeat' }))).toBeNull()
        expect(parseHitlEvent('not-json')).toBeNull()
    })
})

describe('hitl store logic', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('upserts on request and removes on resolved/cancelled/expired', () => {
        const storer = useHitlStorer()
        const logic = createHitlStoreLogic(() => storer)
        const request = approvalRequest('req-1', 'chat-1')

        logic.applyEvent({ type: 'request', request })
        expect(storer.pendingForChat('chat-1')).toHaveLength(1)
        expect(storer.pendingForChat('other')).toHaveLength(0)

        logic.applyEvent({ type: 'resolved', request: { ...request, status: 'resolved' } })
        expect(storer.pendingForChat('chat-1')).toHaveLength(0)

        logic.applyEvent({ type: 'request', request })
        logic.applyEvent({ type: 'expired', request })
        expect(storer.pendingForChat('chat-1')).toHaveLength(0)

        logic.applyEvent({ type: 'request', request })
        logic.applyEvent({ type: 'cancelled', request })
        expect(storer.pendingForChat('chat-1')).toHaveLength(0)
    })

    it('setPending replaces the whole pending set', () => {
        const storer = useHitlStorer()
        const first = normalizeHitlRequest(approvalRequest('req-1', 'chat-1'))!
        const second = normalizeHitlRequest(approvalRequest('req-2', 'chat-1'))!
        storer.setPending([first])
        expect(storer.pendingForChat('chat-1')).toHaveLength(1)
        storer.setPending([second])
        expect(storer.pendingForChat('chat-1').map((item) => item.request.id)).toEqual(['req-2'])
    })
})
