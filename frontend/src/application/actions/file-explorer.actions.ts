import type { FileExplorerStoreLogic } from '../store-logic/file-explorer.logic'
import type { FileExplorerBusinessLogic } from '../business-logic/file-explorer.logic'
import type { FEListDirData, FEMeta, FESearchOptions } from '@/core/entities'

export interface FileExplorerActions {
    loadRoot(workspaceId: string, meta?: FEMeta): Promise<void>
    loadChildren(workspaceId: string, path: string): Promise<void>
    startWatch(workspaceId: string): void
    stopWatch(): void
    toggleExpand(path: string): Promise<void>
    select(path: string | null): Promise<void>
    searchFiles(query: string, opts?: FESearchOptions): Promise<void>
    reset(data: FEListDirData, meta?: FEMeta): void
    dispose(): void
}

export function createFileExplorerActions(
    storeLogic: FileExplorerStoreLogic,
    businessLogic: FileExplorerBusinessLogic,
): FileExplorerActions {
    let workspaceId: string | null = null
    let cleanupWatch: (() => void) | null = null

    async function loadRoot(id: string, meta?: FEMeta): Promise<void> {
        workspaceId = id
        try {
            const data = await businessLogic.listDir(id, '.')
            storeLogic.reset(data, meta)
        } catch (e) {
            console.error('[FileExplorer] failed to load root:', e)
        }
    }

    async function loadChildren(id: string, path: string): Promise<void> {
        storeLogic.setLoadState(path, 'loading')
        try {
            const data = await businessLogic.listDir(id, path)
            storeLogic.loadChildren(data)
        } catch (e) {
            console.error('[FileExplorer] failed to list dir:', path, e)
            storeLogic.setLoadState(path, 'error')
        }
    }

    function startWatch(id: string): void {
        stopWatch()
        cleanupWatch = businessLogic.createWatchConnection(
            id,
            (event) => storeLogic.applyWatchEvent(event),
            (error) => console.error('[FileExplorer] watch connection error:', error),
        )
    }

    function stopWatch(): void {
        cleanupWatch?.()
        cleanupWatch = null
    }

    async function toggleExpand(path: string): Promise<void> {
        const node = storeLogic.getNode(path)
        if (!node?.isDirectory) return

        if (storeLogic.getLoadState(path) === 'idle' && workspaceId) {
            storeLogic.setLoadState(path, 'loading')
            storeLogic.toggleExpand(path)
            await loadChildren(workspaceId, path)
            return
        }
        storeLogic.toggleExpand(path)
    }

    async function select(path: string | null): Promise<void> {
        storeLogic.selectNode(path)
        if (path) {
            const node = storeLogic.getNode(path)
            if (node?.isDirectory) {
                await toggleExpand(path)
            }
        }
    }

    async function searchFiles(query: string, opts?: FESearchOptions): Promise<void> {
        const q = query.trim()
        if (!workspaceId || !q) {
            storeLogic.setSearchResults([])
            return
        }
        try {
            const data = await businessLogic.searchFiles(workspaceId, q, opts)
            storeLogic.setSearchResults(data.matches)
        } catch (e) {
            console.error('[FileExplorer] failed to search files:', e)
            storeLogic.setSearchResults([])
        }
    }

    function reset(data: FEListDirData, meta?: FEMeta): void {
        storeLogic.reset(data, meta)
    }

    function dispose(): void {
        stopWatch()
    }

    return {
        loadRoot,
        loadChildren,
        startWatch,
        stopWatch,
        toggleExpand,
        select,
        searchFiles,
        reset,
        dispose,
    }
}
