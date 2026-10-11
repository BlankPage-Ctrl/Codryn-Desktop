import type { ShellKillPort, ShellKillResult } from '@/core/repositories'

export interface ShellExecBusinessLogic {
    kill(executionId: string): Promise<ShellKillResult>
}

export function createShellExecBusinessLogic(repo: ShellKillPort): ShellExecBusinessLogic {
    return {
        kill: (executionId) => repo.kill(executionId),
    }
}
