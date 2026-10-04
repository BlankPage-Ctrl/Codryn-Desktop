import { describe, it, expect, vi } from 'vitest'
import { createChatTabSchema } from '../chat-tab.schema'
import { createEmptyChatSessionState } from '@/application/stores'
import type { Chat } from '@/core/entities'

function makeChat(): Chat {
    return {
        id: 'chat-1',
        title: 'Chat',
        workspaceId: 'ws-1',
        createdAt: '',
        updatedAt: '',
    }
}

describe('createChatTabSchema error', () => {
    it('maps null when session has no error', () => {
        const schema = createChatTabSchema({
            chat: makeChat(),
            state: createEmptyChatSessionState(),
            providers: [],
        })
        expect(schema.error).toBeNull()
    })

    it('maps message and code from the session error', () => {
        const err = new Error('Slow down') as Error & { code?: string }
        err.code = 'RATE_LIMITED'
        const schema = createChatTabSchema({
            chat: makeChat(),
            state: { ...createEmptyChatSessionState(), error: err },
            providers: [],
        })
        expect(schema.error).toEqual({ message: 'Slow down', code: 'RATE_LIMITED' })
    })

    it('omits code when the error carries none', () => {
        const schema = createChatTabSchema({
            chat: makeChat(),
            state: { ...createEmptyChatSessionState(), error: new Error('boom') },
            providers: [],
        })
        expect(schema.error).toEqual({ message: 'boom' })
    })

    it('passes onDismissError through', () => {
        const onDismissError = vi.fn<() => void>()
        const schema = createChatTabSchema({
            chat: makeChat(),
            state: createEmptyChatSessionState(),
            providers: [],
            onDismissError,
        })
        expect(schema.onDismissError).toBe(onDismissError)
    })
})
