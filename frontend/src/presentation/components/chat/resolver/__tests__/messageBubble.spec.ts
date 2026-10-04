import { describe, it, expect } from 'vitest'
import type { FeedBlock, FeedMessage } from '@/core/entities'
import { resolveMessageBubbleSchema } from '../resolveMessageBubbleSchema'
import { resolveMessageListSchema } from '../resolveMessageListSchema'

function textBlock(text: string): FeedBlock {
    return { kind: 'text', sliceId: 'txt-0', text, closed: true } as FeedBlock
}

function userMessage(id: string, text: string): FeedMessage {
    return {
        id,
        role: 'user',
        blocks: [textBlock(text)],
    } as FeedMessage
}

describe('resolveMessageBubbleSchema copy', () => {
    it('exposes joined text and canCopy for user messages', () => {
        const resolved = resolveMessageBubbleSchema({
            role: 'user',
            blocks: [textBlock('hello'), textBlock('world')],
            messageId: 'm-1',
            onEditMessage: () => {},
        })
        expect(resolved.copyText).toBe('hello\nworld')
        expect(resolved.canCopy).toBe(true)
        expect(resolved.canEdit).toBe(true)
    })

    it('disables copy for empty user text', () => {
        const resolved = resolveMessageBubbleSchema({
            role: 'user',
            blocks: [textBlock('   ')],
            messageId: 'm-1',
            onEditMessage: () => {},
        })
        expect(resolved.copyText).toBe('   ')
        expect(resolved.canCopy).toBe(false)
    })

    it('disables copy for assistant messages', () => {
        const resolved = resolveMessageBubbleSchema({
            role: 'assistant',
            blocks: [textBlock('answer')],
            messageId: 'm-2',
        })
        expect(resolved.copyText).toBe('')
        expect(resolved.canCopy).toBe(false)
        expect(resolved.canEdit).toBe(false)
    })
})

describe('resolveMessageListSchema copy', () => {
    it('fills copyText and canCopy per message', () => {
        const resolved = resolveMessageListSchema({
            messages: [userMessage('u-1', 'hello')],
            emptyMessage: 'empty',
            emptyHint: 'hint',
            onEditMessage: () => {},
        })
        expect(resolved.messages).toHaveLength(1)
        expect(resolved.messages[0]!.copyText).toBe('hello')
        expect(resolved.messages[0]!.canCopy).toBe(true)
    })
})

describe('resolveMessageListSchema identity', () => {
    it('reuses resolved messages whose FeedMessage reference is unchanged', () => {
        const untouched = userMessage('u-1', 'hello')
        const first = resolveMessageListSchema({ messages: [untouched] })
        // New schema object (as rebuilt every stream frame) with the same
        // message references: untouched bubbles must keep identity so
        // v-memo can skip them.
        const second = resolveMessageListSchema({ messages: [untouched] })
        expect(second.messages[0]).toBe(first.messages[0])
        expect(second.messages[0]!.parts).toBe(first.messages[0]!.parts)
    })

    it('re-resolves only the touched message', () => {
        const untouched = userMessage('u-1', 'hello')
        const streaming = userMessage('a-1', 'partial')
        const first = resolveMessageListSchema({ messages: [untouched, streaming] })
        const updatedStreaming = userMessage('a-1', 'partial answer')
        const second = resolveMessageListSchema({ messages: [untouched, updatedStreaming] })
        expect(second.messages[0]).toBe(first.messages[0])
        expect(second.messages[1]).not.toBe(first.messages[1])
        expect(second.messages[1]!.parts[0]).toMatchObject({ type: 'text' })
    })

    it('re-resolves when font defaults change', () => {
        const msg = userMessage('u-1', 'hello')
        const first = resolveMessageListSchema({ messages: [msg], fontSize: 14 })
        const second = resolveMessageListSchema({ messages: [msg], fontSize: 18 })
        expect(second.messages[0]).not.toBe(first.messages[0])
    })
})
