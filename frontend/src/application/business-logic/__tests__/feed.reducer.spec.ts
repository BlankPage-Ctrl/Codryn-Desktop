import { describe, it, expect } from 'vitest'
import { applyFeedEvent } from '../feed.reducer'
import type { FeedEvent, FeedMessage, FeedWorkBlock } from '@/core/entities'

function reduce(events: FeedEvent[]): FeedMessage[] {
    let messages: FeedMessage[] = []
    for (const e of events) messages = applyFeedEvent(messages, e)
    return messages
}

describe('applyFeedEvent', () => {
    it('rebuilds a completed text triple from history', () => {
        const messages = reduce([
            { type: 'text-open', messageId: 'u1', role: 'user', sliceId: 'p1' },
            { type: 'text-delta', messageId: 'u1', role: 'user', sliceId: 'p1', delta: 'halo' },
            { type: 'text-close', messageId: 'u1', role: 'user', sliceId: 'p1' },
        ])
        expect(messages).toHaveLength(1)
        expect(messages[0]!.role).toBe('user')
        expect(messages[0]!.blocks).toEqual([
            { kind: 'text', sliceId: 'p1', text: 'halo', closed: true },
        ])
    })

    it('accumulates live deltas into an open slice', () => {
        const messages = reduce([
            { type: 'text-open', messageId: 'a1', sliceId: 't1' },
            { type: 'text-delta', messageId: 'a1', sliceId: 't1', delta: 'he' },
            { type: 'text-delta', messageId: 'a1', sliceId: 't1', delta: 'llo' },
        ])
        const block = messages[0]!.blocks[0]
        expect(block).toMatchObject({ kind: 'text', text: 'hello', closed: false })
        // Live chunks default to assistant when history role is absent.
        expect(messages[0]!.role).toBe('assistant')
    })

    it('tracks think slices separately from text', () => {
        const messages = reduce([
            { type: 'think-open', messageId: 'a1', sliceId: 'r1' },
            { type: 'think-delta', messageId: 'a1', sliceId: 'r1', delta: 'hmm' },
            { type: 'think-close', messageId: 'a1', sliceId: 'r1' },
        ])
        expect(messages[0]!.blocks).toEqual([
            { kind: 'think', sliceId: 'r1', text: 'hmm', closed: true },
        ])
    })

    it('merges work queued/active/ok into one block', () => {
        const messages = reduce([
            {
                type: 'work-queued',
                messageId: 'a1',
                sliceId: 'c1',
                callId: 'c1',
                implement: 'read_file',
            },
            {
                type: 'work-active',
                messageId: 'a1',
                sliceId: 'c1',
                callId: 'c1',
                implement: 'read_file',
                input: { path: 'x.ts' },
            },
            {
                type: 'work-ok',
                messageId: 'a1',
                sliceId: 'c1',
                callId: 'c1',
                implement: 'read_file',
                input: { path: 'x.ts' },
                output: { content: 'hi' },
            },
        ])
        expect(messages[0]!.blocks).toHaveLength(1)
        expect(messages[0]!.blocks[0]).toMatchObject({
            kind: 'work',
            implement: 'read_file',
            state: 'ok',
            input: { path: 'x.ts' },
            output: { content: 'hi' },
        })
    })

    it('marks work-bad with error text', () => {
        const messages = reduce([
            {
                type: 'work-queued',
                messageId: 'a1',
                sliceId: 'c1',
                callId: 'c1',
                implement: 'run_shell',
            },
            {
                type: 'work-bad',
                messageId: 'a1',
                sliceId: 'c1',
                callId: 'c1',
                implement: 'run_shell',
                input: { command: 'x' },
                errorText: 'nope',
            },
        ])
        expect(messages[0]!.blocks[0]).toMatchObject({
            kind: 'work',
            state: 'bad',
            errorText: 'nope',
        })
    })

    it('attaches notice bodies to the matching work block', () => {
        const messages = reduce([
            {
                type: 'work-queued',
                messageId: 'a1',
                sliceId: 'c1',
                callId: 'c1',
                implement: 'read_file',
            },
            {
                type: 'notice',
                messageId: 'a1',
                sliceId: 'c1:rich',
                callId: 'c1',
                implement: 'read_file',
                body: { toolCallId: 'c1', path: 'x.ts', content: 'RICH' },
            },
        ])
        const block = messages[0]!.blocks[0]!
        expect(block.kind).toBe('work')
        expect((block as FeedWorkBlock).notices).toEqual([
            { toolCallId: 'c1', path: 'x.ts', content: 'RICH' },
        ])
    })

    it('folds an out-of-order notice into a placeholder work block', () => {
        const messages = reduce([
            {
                type: 'notice',
                messageId: 'a1',
                sliceId: 'c9:rich:read_file',
                callId: 'c9',
                implement: 'read_file',
                body: { toolCallId: 'c9', path: 'x.ts', content: 'RICH' },
            },
            {
                type: 'work-queued',
                messageId: 'a1',
                sliceId: 'c9',
                callId: 'c9',
                implement: 'read_file',
            },
        ])
        expect(messages[0]!.blocks).toHaveLength(1)
        const block = messages[0]!.blocks[0]!
        expect(block).toMatchObject({
            kind: 'work',
            callId: 'c9',
            implement: 'read_file',
            state: 'queued',
        })
        expect((block as FeedWorkBlock).notices).toEqual([
            { toolCallId: 'c9', path: 'x.ts', content: 'RICH' },
        ])
    })

    it('records stages and assets', () => {
        const messages = reduce([
            { type: 'stage-open', messageId: 'a1', stage: 0 },
            { type: 'asset', messageId: 'a1', sliceId: 's1', kind: 'link', url: 'https://x' },
            { type: 'stage-close', messageId: 'a1', stage: 0, landed: 'stop' },
        ])
        expect(messages[0]!.blocks).toEqual([
            { kind: 'stage', stage: 0, landed: 'stop' },
            { kind: 'asset', sliceId: 's1', assetKind: 'link', url: 'https://x' },
        ])
    })

    it('is pure (does not mutate input)', () => {
        const before: FeedMessage[] = []
        const after = applyFeedEvent(before, { type: 'text-open', messageId: 'a1', sliceId: 't1' })
        expect(before).toEqual([])
        expect(after).not.toBe(before)
    })

    it('does not merge text blocks when the same sliceId reopens in a later step', () => {
        // Live part IDs (e.g. txt-0) repeat every step; each open must
        // start a fresh block so the conclusion does not glue onto the preamble.
        const messages = reduce([
            { type: 'text-open', messageId: 'a1', sliceId: 'txt-0' },
            { type: 'text-delta', messageId: 'a1', sliceId: 'txt-0', delta: 'preamble' },
            { type: 'text-close', messageId: 'a1', sliceId: 'txt-0' },
            { type: 'stage-open', messageId: 'a1', stage: 1 },
            { type: 'text-open', messageId: 'a1', sliceId: 'txt-0' },
            { type: 'text-delta', messageId: 'a1', sliceId: 'txt-0', delta: 'conclusion' },
            { type: 'text-close', messageId: 'a1', sliceId: 'txt-0' },
        ])
        const texts = messages[0]!.blocks.filter((b) => b.kind === 'text')
        expect(texts).toHaveLength(2)
        expect(texts[0]).toMatchObject({ sliceId: 'txt-0', text: 'preamble', closed: true })
        expect(texts[1]).toMatchObject({ sliceId: 'txt-0', text: 'conclusion', closed: true })
    })

    it('does not merge think blocks when the same sliceId reopens in a later step', () => {
        const messages = reduce([
            { type: 'think-open', messageId: 'a1', sliceId: 'reasoning-0' },
            { type: 'think-delta', messageId: 'a1', sliceId: 'reasoning-0', delta: 'hmm' },
            { type: 'think-close', messageId: 'a1', sliceId: 'reasoning-0' },
            { type: 'think-open', messageId: 'a1', sliceId: 'reasoning-0' },
            { type: 'think-delta', messageId: 'a1', sliceId: 'reasoning-0', delta: 'aha' },
            { type: 'think-close', messageId: 'a1', sliceId: 'reasoning-0' },
        ])
        const thinks = messages[0]!.blocks.filter((b) => b.kind === 'think')
        expect(thinks).toHaveLength(2)
        expect(thinks[0]).toMatchObject({ text: 'hmm', closed: true })
        expect(thinks[1]).toMatchObject({ text: 'aha', closed: true })
    })

    it('marks only the latest block closed when the same sliceId reopens', () => {
        const messages = reduce([
            { type: 'text-open', messageId: 'a1', sliceId: 't1' },
            { type: 'text-delta', messageId: 'a1', sliceId: 't1', delta: 'a' },
            { type: 'text-close', messageId: 'a1', sliceId: 't1' },
            { type: 'text-open', messageId: 'a1', sliceId: 't1' },
        ])
        const texts = messages[0]!.blocks.filter((b) => b.kind === 'text')
        expect(texts).toHaveLength(2)
        expect(texts[0]).toMatchObject({ text: 'a', closed: true })
        expect(texts[1]).toMatchObject({ text: '', closed: false })
    })

    it('keeps multi-step streams ordered: preamble, tools, then conclusion', () => {
        const messages = reduce([
            { type: 'stage-open', messageId: 'a1', stage: 0 },
            { type: 'text-open', messageId: 'a1', sliceId: 'txt-0' },
            { type: 'text-delta', messageId: 'a1', sliceId: 'txt-0', delta: 'preamble' },
            { type: 'text-close', messageId: 'a1', sliceId: 'txt-0' },
            {
                type: 'work-queued',
                messageId: 'a1',
                sliceId: 'c1',
                callId: 'c1',
                implement: 'read_file',
            },
            {
                type: 'work-ok',
                messageId: 'a1',
                sliceId: 'c1',
                callId: 'c1',
                implement: 'read_file',
                input: {},
                output: {},
            },
            { type: 'stage-open', messageId: 'a1', stage: 1 },
            { type: 'text-open', messageId: 'a1', sliceId: 'txt-0' },
            { type: 'text-delta', messageId: 'a1', sliceId: 'txt-0', delta: 'conclusion' },
            { type: 'text-close', messageId: 'a1', sliceId: 'txt-0' },
        ])
        const kinds = messages[0]!.blocks.map((b) => b.kind)
        expect(kinds).toEqual(['stage', 'text', 'work', 'stage', 'text'])
        const texts = messages[0]!.blocks.filter((b) => b.kind === 'text')
        expect(texts[1]).toMatchObject({ text: 'conclusion' })
    })

    it('does not duplicate a stage block when stage-close repeats', () => {
        const messages = reduce([
            { type: 'stage-open', messageId: 'a1', stage: 2 },
            { type: 'stage-close', messageId: 'a1', stage: 2, landed: 'tool-calls' },
            { type: 'stage-close', messageId: 'a1', stage: 2, landed: 'tool-calls' },
        ])
        expect(messages[0]!.blocks).toEqual([{ kind: 'stage', stage: 2, landed: 'tool-calls' }])
    })
})
