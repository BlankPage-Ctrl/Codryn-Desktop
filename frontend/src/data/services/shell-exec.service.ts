import { KillExecution } from '../../../wailsjs/go/shellexec/Service'
import type { ShellKillPort, ShellKillResult } from '@/core/repositories'

export const shellKillRepository: ShellKillPort = {
    kill: (executionId: string) => KillExecution(executionId) as Promise<ShellKillResult>,
}
