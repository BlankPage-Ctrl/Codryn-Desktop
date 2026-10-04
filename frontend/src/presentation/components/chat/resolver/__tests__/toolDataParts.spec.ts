import { describe, it, expect } from 'vitest'
import { PathArrow, InputSearch } from '@iconoir/vue'
import type { FeedBlock } from '@/core/entities'
import { resolveMessageParts } from '../resolvePartsSchema'
import { isKnownToolName } from '../../helpers/knownTools'
import { createToolCallSchema } from '@/presentation/schemas/chat/tool-call.schema'

describe('feed blocks', () => {
    it('registers edit_file as a known tool', () => {
        expect(isKnownToolName('edit_file')).toBe(true)
    })

    it('attaches notice body as frontend on the matching tool-call', () => {
        const blocks: FeedBlock[] = [
            {
                kind: 'work',
                sliceId: 'c1',
                callId: 'c1',
                implement: 'edit_file',
                state: 'ok',
                input: { raw: 'src/a.ts' },
                output: 'done',
                notices: [
                    {
                        toolCallId: 'c1',
                        path: 'src/a.ts',
                        appliedEdits: 1,
                        content: 'new\n',
                        encoding: 'utf-8',
                        size: 4,
                        totalLines: 1,
                        diff: '@@ -1,1 +1,1 @@\n-old\n+new',
                    },
                ],
            },
        ]
        const resolved = resolveMessageParts(blocks)
        expect(resolved).toHaveLength(1)
        const first = resolved[0]
        if (first?.type !== 'tool-call') throw new Error('expected a tool-call part')
        expect(first.toolName).toBe('edit_file')
        const frontend = first.frontend
        if (!frontend || !('path' in frontend) || !('diff' in frontend)) {
            throw new Error('expected edit file tool data')
        }
        expect(frontend.path).toBe('src/a.ts')
        expect(frontend.diff).toContain('+new')
    })

    it('registers insight_trace and grep as known tools', () => {
        expect(isKnownToolName('insight_trace')).toBe(true)
        expect(isKnownToolName('grep')).toBe(true)
    })

    it('maps text/think/stage/asset blocks', () => {
        const blocks: FeedBlock[] = [
            { kind: 'text', sliceId: 't1', text: 'hi', closed: true },
            { kind: 'think', sliceId: 'r1', text: 'hmm', closed: false },
            { kind: 'stage', stage: 0, landed: 'stop' },
            { kind: 'asset', sliceId: 's1', assetKind: 'link', url: 'https://x', title: 'X' },
        ]
        const resolved = resolveMessageParts(blocks)
        expect(resolved.map((p) => p.type)).toEqual(['text', 'reasoning', 'step-start', 'source'])
        const text = resolved[0]
        if (text?.type !== 'text') throw new Error('expected text')
        expect(text.state).toBe('done')
        const think = resolved[1]
        if (think?.type !== 'reasoning') throw new Error('expected reasoning')
        expect(think.state).toBe('streaming')
    })
})

describe('tool call schema', () => {
    it('titles trace from query', () => {
        const schema = createToolCallSchema({
            toolName: 'insight_trace',
            state: 'ok',
            input: { query: 'loginUser' },
        })
        expect(schema.title).toBe('Trace loginUser')
    })

    it('titles directed trace as from → to', () => {
        const schema = createToolCallSchema({
            toolName: 'insight_trace',
            state: 'ok',
            input: { query: 'x', from: 'loginUser', to: 'saveSession' },
        })
        expect(schema.title).toBe('Trace loginUser → saveSession')
    })

    it('falls back to Trace label without query', () => {
        const schema = createToolCallSchema({ toolName: 'insight_trace', state: 'ok' })
        expect(schema.title).toBe('Trace')
    })

    it('titles grep from pattern', () => {
        const schema = createToolCallSchema({
            toolName: 'grep',
            state: 'ok',
            input: { pattern: 'useState' },
        })
        expect(schema.title).toBe('Grep "useState"')
    })

    it('keeps trace and grep blocks static (no expand, no view toggle)', () => {
        for (const toolName of ['insight_trace', 'grep']) {
            const schema = createToolCallSchema({ toolName, state: 'ok', input: {} })
            expect(schema.collapsible).toBe(false)
            expect(schema.viewToggle).toBe(false)
            expect(schema.defaultExpanded).toBe(false)
        }
    })

    it('assigns distinct icons to trace and grep', () => {
        const trace = createToolCallSchema({ toolName: 'insight_trace', state: 'ok' })
        const grep = createToolCallSchema({ toolName: 'grep', state: 'ok' })
        expect(trace.icon).toBe(PathArrow)
        expect(grep.icon).toBe(InputSearch)
    })
})
