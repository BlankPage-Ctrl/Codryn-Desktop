import type { Workspace } from '@/core/entities'
import type { WorkspaceStorer } from '../stores/workspace.storer'

export interface WorkspaceStoreLogic {
    beginLoad(): void
    endLoad(): void
    setError(message: string): void
    clearError(): void
    setWorkspaces(list: Workspace[]): void
    upsertWorkspace(ws: Workspace): void
    removeWorkspace(id: string): void
    selectWorkspace(id: string | null): void
}

export function createWorkspaceStoreLogic(getStorer: () => WorkspaceStorer): WorkspaceStoreLogic {
    function beginLoad(): void {
        const storer = getStorer()
        storer.setLoading(true)
        storer.clearError()
    }

    function endLoad(): void {
        getStorer().setLoading(false)
    }

    function setError(message: string): void {
        getStorer().setError(message)
    }

    function clearError(): void {
        getStorer().clearError()
    }

    function setWorkspaces(list: Workspace[]): void {
        getStorer().setWorkspaces(list)
    }

    function upsertWorkspace(ws: Workspace): void {
        getStorer().upsertWorkspace(ws)
    }

    function removeWorkspace(id: string): void {
        getStorer().removeWorkspace(id)
    }

    function selectWorkspace(id: string | null): void {
        getStorer().setSelectedId(id)
    }

    return {
        beginLoad,
        endLoad,
        setError,
        clearError,
        setWorkspaces,
        upsertWorkspace,
        removeWorkspace,
        selectWorkspace,
    }
}
