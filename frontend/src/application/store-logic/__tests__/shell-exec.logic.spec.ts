import { describe, it, expect } from 'vitest'
import { createShellExecStoreLogic } from '../shell-exec.logic'
import {
    createEmptyShellExecState,
    type ShellExecState,
    type ShellExecStorer,
} from '../../stores/shell-exec.storer'
import type { FEShellExecEvent } from '@/core/entities'

function setup() {
    const states = new Map<string, ShellExecState>()
    const storer = {
        byToolCall: {} as Record<string, ShellExecState>,
        ensure: (key: string, init: ShellExecState) => {
            if (!states.has(key)) states.set(key, init)
            storer.byToolCall = Object.fromEntries(states)
        },
        patch: (key: string, patch: Partial<ShellExecState>) => {
            const current = states.get(key)
            if (!current) return
            states.set(key, { ...current, ...patch })
            storer.byToolCall = Object.fromEntries(states)
        },
        appendLine: (key: string, line: ShellExecState['lines'][number]) => {
            const current = states.get(key)
            if (!current) return
            current.lines.push(line)
        },
        remove: (key: string) => {
            states.delete(key)
        },
        clear: () => {
            states.clear()
        },
    } as unknown as ShellExecStorer
    const logic = createShellExecStoreLogic(() => storer)
    return { logic, states }
}

function start(toolCallId: string, executionId: string): FEShellExecEvent {
    return { type: 'start', executionId, toolCallId, workspaceId: 'ws-1', command: 'sleep 30', cwd: '/' }
}

describe('shell-exec store logic', () => {
    it('marks a running shell stopped on the killed event, keeping its lines', () => {
        const { logic, states } = setup()
        logic.apply(start('tool-1', 'exec-1'))
        logic.apply({ type: 'chunk', executionId: 'exec-1', toolCallId: 'tool-1', workspaceId: 'ws-1', stream: 'stdout', text: 'partial output', at: 1 })
        logic.apply({ type: 'killed', executionId: 'exec-1', toolCallId: 'tool-1', workspaceId: 'ws-1', signal: 'SIGKILL', at: 2 })

        const state = states.get('tool-1')
        expect(state?.status).toBe('error')
        expect(state?.error).toEqual({ code: 'SHELL_KILLED', message: 'Shell stopped by user' })
        expect(state?.lines).toHaveLength(1)
        expect(state?.executionId).toBe('exec-1')
    })

    it('markKilledByExecutionId only touches the matching running execution', () => {
        const { logic, states } = setup()
        logic.apply(start('tool-1', 'exec-1'))
        logic.apply(start('tool-2', 'exec-2'))
        states.set(
            'tool-3',
            createEmptyShellExecState({ executionId: 'exec-3', toolCallId: 'tool-3', status: 'done' }),
        )

        logic.markKilledByExecutionId('exec-1')

        expect(states.get('tool-1')?.status).toBe('error')
        expect(states.get('tool-1')?.error?.code).toBe('SHELL_KILLED')
        expect(states.get('tool-2')?.status).toBe('running')
        expect(states.get('tool-3')?.status).toBe('done')
    })

    it('markKilledByExecutionId ignores empty ids', () => {
        const { logic, states } = setup()
        logic.apply(start('tool-1', 'exec-1'))

        logic.markKilledByExecutionId('')

        expect(states.get('tool-1')?.status).toBe('running')
    })
})
