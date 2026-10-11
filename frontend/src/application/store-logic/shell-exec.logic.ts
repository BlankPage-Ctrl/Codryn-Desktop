import type { FEShellExecEvent } from '@/core/entities'
import type { ShellExecState, ShellExecStorer } from '../stores/shell-exec.storer'
import { createEmptyShellExecState } from '../stores/shell-exec.storer'

export interface ShellExecStoreLogic {
    apply(event: FEShellExecEvent): void
    markKilledByExecutionId(executionId: string): void
}

function startState(event: Extract<FEShellExecEvent, { type: 'start' }>): ShellExecState {
    return createEmptyShellExecState({
        executionId: event.executionId,
        toolCallId: event.toolCallId,
        command: event.command,
        cwd: event.cwd,
        status: 'running',
    })
}

export function createShellExecStoreLogic(getStorer: () => ShellExecStorer): ShellExecStoreLogic {
    function apply(event: FEShellExecEvent): void {
        const storer = getStorer()
        const key = event.toolCallId ?? event.executionId
        if (!key) return

        switch (event.type) {
            case 'start':
                storer.ensure(key, startState(event))
                break
            case 'chunk':
                storer.appendLine(key, {
                    stream: event.stream,
                    text: event.text,
                    at: event.at,
                })
                storer.patch(key, { executionId: event.executionId })
                break
            case 'done':
                storer.patch(key, {
                    executionId: event.executionId,
                    status: 'done',
                    result: event.data,
                })
                break
            case 'error':
                storer.patch(key, {
                    executionId: event.executionId,
                    status: 'error',
                    error: { code: event.code, message: event.message },
                })
                break
            case 'killed':
                storer.patch(key, {
                    executionId: event.executionId,
                    status: 'error',
                    error: { code: 'SHELL_KILLED', message: 'Shell stopped by user' },
                })
                break
        }
    }

    function markKilledByExecutionId(executionId: string): void {
        if (!executionId) return
        const storer = getStorer()
        for (const key of Object.keys(storer.byToolCall)) {
            const current = storer.byToolCall[key]
            if (!current || current.executionId !== executionId) continue
            if (current.status !== 'running') continue
            storer.patch(key, {
                status: 'error',
                error: { code: 'SHELL_KILLED', message: 'Shell stopped by user' },
            })
        }
    }

    return { apply, markKilledByExecutionId }
}
