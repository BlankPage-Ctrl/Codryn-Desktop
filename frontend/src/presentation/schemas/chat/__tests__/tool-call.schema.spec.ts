import { describe, it, expect } from 'vitest'
import { createToolCallSchema } from '../tool-call.schema'

const ROOT = '/home/wilfredo/Project/Codryn'

describe('createToolCallSchema informative titles', () => {
    it('titles an edit with truncated path and diff counts', () => {
        const schema = createToolCallSchema({
            toolName: 'edit_file',
            toolCallId: 'c1',
            state: 'ok',
            input: { path: `${ROOT}/Codryn-Desktop/frontend/src/presentation/components/plugin/components/RegisterForm.vue` },
            output: { diff: '-old\n-old2\n+new\n context' },
            workspaceRoot: ROOT,
        })
        expect(schema.title).toContain('Edit ')
        expect(schema.title).toContain('-2')
        expect(schema.title).toContain('+1')
        expect(schema.titleTooltip).toContain(
            'Codryn-Desktop/frontend/src/presentation/components/plugin/components/RegisterForm.vue',
        )
        const tones = (schema.titleParts ?? []).map((p) => p.tone ?? 'default')
        expect(tones).toContain('red')
        expect(tones).toContain('green')
    })

    it('titles a read with limit/from params', () => {
        const schema = createToolCallSchema({
            toolName: 'read_file',
            toolCallId: 'c2',
            state: 'ok',
            input: { path: `${ROOT}/src/a.ts`, offset: 93, limit: 8 },
            workspaceRoot: ROOT,
        })
        expect(schema.title).toContain('Read src/a.ts')
        expect(schema.title).toContain('from: 93 - 100')
        expect(schema.titleTooltip).toContain('Read src/a.ts from: 93 - 100')
    })

    it('titles a create with filename, dir and added lines', () => {
        const schema = createToolCallSchema({
            toolName: 'create_file',
            toolCallId: 'c3',
            state: 'ok',
            input: { path: `${ROOT}/notes/todo.md` },
            frontend: { path: `${ROOT}/notes/todo.md`, content: 'a\nb\nc', totalLines: 3 },
            workspaceRoot: ROOT,
        })
        expect(schema.title).toContain('Create todo.md at notes with +3')
    })

    it('titles an overwrite as Replace', () => {
        const schema = createToolCallSchema({
            toolName: 'create_file',
            toolCallId: 'c4',
            state: 'ok',
            input: { path: `${ROOT}/notes/todo.md`, overwrite: true },
            frontend: { path: `${ROOT}/notes/todo.md`, content: 'a\nb', totalLines: 2 },
            workspaceRoot: ROOT,
        })
        expect(schema.title).toContain('Replace todo.md at notes with +2 new line of code')
    })

    it('uses Run while active and Ran when settled', () => {
        const running = createToolCallSchema({
            toolName: 'run_shell',
            toolCallId: 'c5',
            state: 'active',
            input: { command: 'npm run test' },
        })
        expect(running.title).toBe('Run npm run test')
        expect(running.titleTooltip).toBe('Run npm run test')

        const done = createToolCallSchema({
            toolName: 'run_shell',
            toolCallId: 'c5',
            state: 'ok',
            input: { command: 'npm run test' },
        })
        expect(done.title).toBe('Ran npm run test')
    })

    it('marks cancelled shells as settled, not streaming', () => {
        const schema = createToolCallSchema({
            toolName: 'run_shell',
            toolCallId: 'c6',
            state: 'cancelled',
            input: { command: 'sleep 30' },
        })
        expect(schema.status).toBe('done')
        expect(schema.title).toBe('Ran sleep 30')
    })
})
