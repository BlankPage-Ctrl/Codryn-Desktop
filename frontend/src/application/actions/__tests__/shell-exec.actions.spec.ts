import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createShellExecActions } from '../shell-exec.actions'
import type { ShellExecBusinessLogic } from '../../business-logic/shell-exec.logic'
import type { ShellExecStoreLogic } from '../../store-logic/shell-exec.logic'
import type { ShellKillResult } from '@/core/repositories'

function setup(killImpl?: (executionId: string) => Promise<ShellKillResult>) {
    const storeLogic = {
        apply: vi.fn(),
        markKilledByExecutionId: vi.fn<(executionId: string) => void>(),
    } as unknown as ShellExecStoreLogic

    const businessLogic = {
        kill: vi.fn<(executionId: string) => Promise<ShellKillResult>>(
            killImpl ?? (async (executionId) => ({ executionId, killed: true })),
        ),
    } as unknown as ShellExecBusinessLogic

    const actions = createShellExecActions(storeLogic, businessLogic)
    return { actions, storeLogic, businessLogic }
}

describe('shell-exec actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('waits for the backend kill then marks the run stopped', async () => {
        const { actions, storeLogic, businessLogic } = setup()
        const order: string[] = []
        businessLogic.kill = vi.fn(async (executionId: string) => {
            order.push('kill')
            return { executionId, killed: true }
        })
        const mark = storeLogic.markKilledByExecutionId as ReturnType<typeof vi.fn>
        mark.mockImplementation(() => {
            order.push('mark')
        })

        const ok = await actions.killExecution('exec-1')

        expect(ok).toBe(true)
        expect(businessLogic.kill).toHaveBeenCalledWith('exec-1')
        expect(storeLogic.markKilledByExecutionId).toHaveBeenCalledWith('exec-1')
        expect(order).toEqual(['kill', 'mark'])
    })

    it('resolves false without touching state when the kill fails', async () => {
        const { actions, storeLogic } = setup(async () => {
            throw new Error('backend not connected')
        })

        const ok = await actions.killExecution('exec-1')

        expect(ok).toBe(false)
        expect(storeLogic.markKilledByExecutionId).not.toHaveBeenCalled()
    })

    it('keeps the running state when the backend reports nothing killed', async () => {
        const { actions, storeLogic } = setup(async (executionId) => ({
            executionId,
            killed: false,
        }))

        const ok = await actions.killExecution('exec-1')

        expect(ok).toBe(false)
        expect(storeLogic.markKilledByExecutionId).not.toHaveBeenCalled()
    })

    it('resolves false for an empty execution id', async () => {
        const { actions, storeLogic, businessLogic } = setup()

        const ok = await actions.killExecution('')

        expect(ok).toBe(false)
        expect(businessLogic.kill).not.toHaveBeenCalled()
        expect(storeLogic.markKilledByExecutionId).not.toHaveBeenCalled()
    })
})
