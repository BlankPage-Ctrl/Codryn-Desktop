import type { FEFileNode, FELoadState, FEListDirData, FEMeta, FEWatchEvent } from '@/core/entities'
import type { FileExplorerStorer } from '../stores/file-explorer.storer'

export interface FileExplorerStoreLogic {
    reset(data: FEListDirData, meta?: FEMeta): void
    setLoadState(path: string, state: FELoadState): void
    loadChildren(data: FEListDirData): void
    toggleExpand(path: string): void
    selectNode(path: string | null): void
    setSearchResults(nodes: FEFileNode[]): void
    getNode(path: string): FEFileNode | undefined
    getLoadState(path: string): FELoadState
    applyWatchEvent(event: FEWatchEvent): void
}

export function createFileExplorerStoreLogic(
    getStorer: () => FileExplorerStorer,
): FileExplorerStoreLogic {
    function reset(data: FEListDirData, meta?: FEMeta): void {
        getStorer().reset(data, meta)
    }

    function setLoadState(path: string, state: FELoadState): void {
        getStorer().setLoadState(path, state)
    }

    function loadChildren(data: FEListDirData): void {
        getStorer().loadChildren(data)
    }

    function toggleExpand(path: string): void {
        getStorer().toggleExpand(path)
    }

    function selectNode(path: string | null): void {
        getStorer().selectNode(path)
    }

    function setSearchResults(nodes: FEFileNode[]): void {
        getStorer().setSearchResults(nodes)
    }

    function getNode(path: string): FEFileNode | undefined {
        return getStorer().getNode(path)
    }

    function getLoadState(path: string): FELoadState {
        return getStorer().getLoadState(path)
    }

    function applyWatchEvent(event: FEWatchEvent): void {
        getStorer().applyWatchEvent(event)
    }

    return {
        reset,
        setLoadState,
        loadChildren,
        toggleExpand,
        selectNode,
        setSearchResults,
        getNode,
        getLoadState,
        applyWatchEvent,
    }
}
