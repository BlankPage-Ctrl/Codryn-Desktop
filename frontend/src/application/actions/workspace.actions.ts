import type { WorkspaceStoreLogic } from '../store-logic/workspace.logic'
import type { WorkspaceBusinessLogic } from '../business-logic/workspace.logic'
import type { WorkspaceDto } from '@/core/entities'
import { toMessage } from '@/shared/utils/error.utils'

export interface WorkspaceActions {
    fetchWorkspaces(): Promise<void>
    createWorkspace(dto: WorkspaceDto): Promise<void>
    updateWorkspace(id: string, dto: Partial<WorkspaceDto>): Promise<void>
    deleteWorkspace(id: string): Promise<void>
    selectWorkspace(id: string | null): void
}

export function createWorkspaceActions(
    storeLogic: WorkspaceStoreLogic,
    businessLogic: WorkspaceBusinessLogic,
): WorkspaceActions {
    async function fetchWorkspaces(): Promise<void> {
        storeLogic.beginLoad()
        try {
            storeLogic.setWorkspaces(await businessLogic.list())
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to load workspaces')
        } finally {
            storeLogic.endLoad()
        }
    }

    async function createWorkspace(dto: WorkspaceDto): Promise<void> {
        storeLogic.clearError()
        try {
            const ws = await businessLogic.create(dto)
            storeLogic.upsertWorkspace(ws)
            storeLogic.selectWorkspace(ws.id)
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to create workspace')
            throw e
        }
    }

    async function updateWorkspace(id: string, dto: Partial<WorkspaceDto>): Promise<void> {
        storeLogic.clearError()
        try {
            storeLogic.upsertWorkspace(await businessLogic.update(id, dto))
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to update workspace')
            throw e
        }
    }

    async function deleteWorkspace(id: string): Promise<void> {
        storeLogic.clearError()
        try {
            await businessLogic.remove(id)
            storeLogic.removeWorkspace(id)
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to delete workspace')
            throw e
        }
    }

    function selectWorkspace(id: string | null): void {
        storeLogic.selectWorkspace(id)
    }

    return {
        fetchWorkspaces,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        selectWorkspace,
    }
}
