import type { ShellExecStoreLogic } from '../store-logic/shell-exec.logic'
import type { ShellExecBusinessLogic } from '../business-logic/shell-exec.logic'
import { toMessage } from '@/shared/utils/error.utils'

export interface ShellExecActions {
    killExecution(executionId: string): Promise<boolean>
}

export function createShellExecActions(
    storeLogic: ShellExecStoreLogic,
    businessLogic: ShellExecBusinessLogic,
): ShellExecActions {
    async function killExecution(executionId: string): Promise<boolean> {
        if (!executionId) return false
        try {
            const result = await businessLogic.kill(executionId)
            if (!result.killed) return false
            storeLogic.markKilledByExecutionId(executionId)
            return true
        } catch (e: unknown) {
            if (import.meta.env.DEV) {
                console.log('[shell-exec] killExecution failed:', toMessage(e))
            }
            return false
        }
    }

    return { killExecution }
}
