import { describe, it, expect } from 'vitest'
import type { FeedBlock } from '@/core/entities'
import {
    groupConsecutiveToolCalls,
    loopFinishedStepCount,
    maybeWrapWorkLog,
    resolveMessageParts,
    resolveToolCallGroupPartSchema,
    resolveWorkLogPartSchema,
} from '../resolvePartsSchema'
import type { MessagePartSchema } from '../../types/schema'

function textBlock(text: string): FeedBlock {
    return { kind: 'text', sliceId: `txt-${text}`, text, closed: true } as FeedBlock
}

function thinkBlock(text: string): FeedBlock {
    return { kind: 'think', sliceId: `thk-${text}`, text, closed: true } as FeedBlock
}

function workBlock(callId: string, tool = 'read_file'): FeedBlock {
    return {
        kind: 'work',
        sliceId: callId,
        callId,
        implement: tool,
        state: 'ok',
        notices: [],
    } as FeedBlock
}

function stageBlock(stage: number, landed?: string): FeedBlock {
    return { kind: 'stage', stage, ...(landed !== undefined ? { landed } : {}) } as FeedBlock
}

function asWorkLog(part: MessagePartSchema): Extract<MessagePartSchema, { type: 'work-log' }> {
    if (part.type !== 'work-log') throw new Error(`expected work-log, got ${part.type}`)
    return part
}

function asToolCallGroup(
    part: MessagePartSchema,
): Extract<MessagePartSchema, { type: 'tool-call-group' }> {
    if (part.type !== 'tool-call-group')
        throw new Error(`expected tool-call-group, got ${part.type}`)
    return part
}

describe('groupConsecutiveToolCalls', () => {
    it('merges 3 consecutive tool calls into one group', () => {
        const parts = resolveMessageParts([workBlock('c-1'), workBlock('c-2'), workBlock('c-3')])
        expect(parts).toHaveLength(1)
        expect(parts[0]!.type).toBe('tool-call-group')
        expect(asToolCallGroup(parts[0]!).items).toHaveLength(3)
    })

    it('keeps a single tool call flat', () => {
        const parts = resolveMessageParts([workBlock('c-1')])
        expect(parts).toHaveLength(1)
        expect(parts[0]!.type).toBe('tool-call')
    })

    it('breaks the run on text parts', () => {
        const parts = resolveMessageParts([workBlock('c-1'), textBlock('mid'), workBlock('c-2')])
        expect(parts.map((p) => p.type)).toEqual(['tool-call', 'text', 'tool-call'])
    })

    it('breaks the run on reasoning parts', () => {
        const parts = resolveMessageParts([
            workBlock('c-1'),
            workBlock('c-2'),
            thinkBlock('hmm'),
            workBlock('c-3'),
        ])
        expect(parts.map((p) => p.type)).toEqual(['tool-call-group', 'reasoning', 'tool-call'])
    })

    it('groups each run separately', () => {
        const parts = groupConsecutiveToolCalls(
            resolveMessageParts([workBlock('c-1'), workBlock('c-2')]).flatMap((p) =>
                p.type === 'tool-call-group'
                    ? p.items.map((i) => ({ type: 'tool-call' as const, ...i }))
                    : [p],
            ),
        )
        expect(parts).toHaveLength(1)
        expect(parts[0]!.type).toBe('tool-call-group')
    })
})

describe('loopFinishedStepCount', () => {
    it('returns null without stage blocks', () => {
        expect(loopFinishedStepCount([workBlock('c-1')])).toBeNull()
    })

    it('returns null while the latest stage is still running', () => {
        expect(loopFinishedStepCount([stageBlock(0), stageBlock(1)])).toBeNull()
    })

    it('returns null when the latest stage landed tool-calls', () => {
        expect(loopFinishedStepCount([stageBlock(0, 'tool-calls')])).toBeNull()
    })

    it('returns the stage count when the latest stage landed stop', () => {
        expect(loopFinishedStepCount([stageBlock(0, 'tool-calls'), stageBlock(1, 'stop')])).toBe(2)
    })
})

describe('maybeWrapWorkLog', () => {
    function finishedBlocks(): FeedBlock[] {
        return [
            thinkBlock('plan'),
            workBlock('c-1'),
            workBlock('c-2'),
            textBlock('final answer'),
            stageBlock(0, 'tool-calls'),
            stageBlock(1, 'stop'),
        ]
    }

    it('wraps everything before the final text into a work-log', () => {
        const parts = resolveMessageParts(finishedBlocks())
        expect(parts.map((p) => p.type)).toEqual(['work-log', 'text', 'step-start', 'step-start'])
        const log = asWorkLog(parts[0]!)
        expect(log.stepCount).toBe(2)
        expect(log.items.map((p) => p.type)).toEqual(['reasoning', 'tool-call-group'])
    })

    it('keeps intermediate text inside the work-log', () => {
        const parts = resolveMessageParts([
            thinkBlock('plan'),
            textBlock('mid update'),
            workBlock('c-1'),
            textBlock('final answer'),
            stageBlock(0, 'stop'),
        ])
        expect(parts.map((p) => p.type)).toEqual(['work-log', 'text', 'step-start'])
        const log = asWorkLog(parts[0]!)
        expect(log.items.map((p) => p.type)).toEqual(['reasoning', 'text', 'tool-call'])
    })

    it('does not wrap while the loop is still running', () => {
        const parts = resolveMessageParts([workBlock('c-1'), workBlock('c-2'), stageBlock(0)])
        expect(parts.map((p) => p.type)).toEqual(['tool-call-group', 'step-start'])
    })

    it('does not wrap when there is no work before the final text', () => {
        const parts = resolveMessageParts([textBlock('plain answer'), stageBlock(0, 'stop')])
        expect(parts.map((p) => p.type)).toEqual(['text', 'step-start'])
    })

    it('does not wrap a work-only message without final text', () => {
        const wrapped = maybeWrapWorkLog(
            [{ type: 'tool-call', toolName: 'grep', toolCallId: 'c-1', state: 'ok' }],
            1,
        )
        expect(wrapped.map((p) => p.type)).toEqual(['tool-call'])
    })
})

describe('resolveToolCallGroupPartSchema', () => {
    it('counts states and expands small groups', () => {
        const resolved = resolveToolCallGroupPartSchema({
            items: [
                { toolName: 'read_file', toolCallId: 'c-1', state: 'ok' },
                { toolName: 'grep', toolCallId: 'c-2', state: 'active' },
            ],
        })
        expect(resolved.count).toBe(2)
        expect(resolved.running).toBe(1)
        expect(resolved.done).toBe(1)
        expect(resolved.statusText).toBe('Running...')
        expect(resolved.defaultExpanded).toBe(true)
    })

    it('collapses groups larger than the threshold and reports failures', () => {
        const resolved = resolveToolCallGroupPartSchema({
            items: [
                { toolName: 'read_file', toolCallId: 'c-1', state: 'ok' },
                { toolName: 'grep', toolCallId: 'c-2', state: 'bad' },
                { toolName: 'list_files', toolCallId: 'c-3', state: 'ok' },
            ],
        })
        expect(resolved.failed).toBe(1)
        expect(resolved.statusText).toBe('1 failed')
        expect(resolved.defaultExpanded).toBe(false)
    })
})

describe('resolveWorkLogPartSchema', () => {
    it('summarizes steps, tools, and stays collapsed', () => {
        const resolved = resolveWorkLogPartSchema({
            stepCount: 2,
            items: [
                { type: 'reasoning', text: 'plan', state: 'done' },
                {
                    type: 'tool-call-group',
                    items: [
                        { toolName: 'read_file', toolCallId: 'c-1', state: 'ok' },
                        { toolName: 'grep', toolCallId: 'c-2', state: 'ok' },
                    ],
                },
            ],
        })
        expect(resolved.stepCount).toBe(2)
        expect(resolved.toolCount).toBe(2)
        expect(resolved.thinkCount).toBe(1)
        expect(resolved.statusText).toBe('Done')
        expect(resolved.defaultExpanded).toBe(false)
    })
})
