import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { FEShellRunData, ShellExecLine } from '@/core/entities'

export interface ShellExecState {
    executionId: string | null
    toolCallId: string | null
    command: string
    cwd: string
    lines: ShellExecLine[]
    status: 'running' | 'done' | 'error'
    stdout: string
    stderr: string
    result: FEShellRunData | null
    error: { code: string; message: string } | null
}

export function createEmptyShellExecState(init: Partial<ShellExecState> = {}): ShellExecState {
    return {
        executionId: null,
        toolCallId: null,
        command: '',
        cwd: '',
        lines: [],
        status: 'running',
        stdout: '',
        stderr: '',
        result: null,
        error: null,
        ...init,
    }
}

export const useShellExecStorer = defineStore('shell-exec', () => {
    const byToolCall = ref<Record<string, ShellExecState>>({})

    function ensure(toolCallId: string, init: ShellExecState): void {
        if (!byToolCall.value[toolCallId]) {
            byToolCall.value[toolCallId] = init
        }
    }

    function patch(toolCallId: string, patch: Partial<ShellExecState>): void {
        const current = byToolCall.value[toolCallId]
        if (!current) return
        byToolCall.value[toolCallId] = { ...current, ...patch }
    }

    function appendLine(toolCallId: string, line: ShellExecLine): void {
        const current = byToolCall.value[toolCallId]
        if (!current) return
        current.lines.push(line)
        if (line.stream === 'stdout') current.stdout += line.text
        else current.stderr += line.text
    }

    function remove(toolCallId: string): void {
        delete byToolCall.value[toolCallId]
    }

    function clear(): void {
        byToolCall.value = {}
    }

    return {
        byToolCall,
        ensure,
        patch,
        appendLine,
        remove,
        clear,
    }
})

export type ShellExecStorer = ReturnType<typeof useShellExecStorer>
