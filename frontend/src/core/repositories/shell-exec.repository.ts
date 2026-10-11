import type { FEShellExecEvent } from '@/core/entities'

export interface ShellExecWatchHandlers {
    onEvent: (event: FEShellExecEvent) => void
    onError?: (error: Event) => void
}

export interface ShellExecPort {
    watch(workspaceId: string, handlers: ShellExecWatchHandlers): () => void
}

export interface ShellKillResult {
    executionId: string
    killed: boolean
}

export interface ShellKillPort {
    kill(executionId: string): Promise<ShellKillResult>
}
