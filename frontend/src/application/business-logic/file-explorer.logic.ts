import type { FileRepository, FileWatchPort } from '@/core/repositories'
import type { FESearchData, FESearchOptions, FEListDirData, FEWatchEvent } from '@/core/entities'

export interface FileExplorerBusinessLogicDeps {
    fileRepo: FileRepository
    watch: FileWatchPort
}

export interface FileExplorerBusinessLogic {
    listDir(workspaceId: string, path: string): Promise<FEListDirData>
    searchFiles(workspaceId: string, query: string, opts?: FESearchOptions): Promise<FESearchData>
    createWatchConnection(
        workspaceId: string,
        onEvent: (event: FEWatchEvent) => void,
        onError?: (error: Event) => void,
    ): () => void
}

export function createFileExplorerBusinessLogic(
    deps: FileExplorerBusinessLogicDeps,
): FileExplorerBusinessLogic {
    return {
        listDir: (workspaceId, path) => deps.fileRepo.listDir(workspaceId, path),
        searchFiles: (workspaceId, query, opts) =>
            deps.fileRepo.searchFiles(workspaceId, query, opts),
        createWatchConnection: (workspaceId, onEvent, onError) =>
            deps.watch.createWatchConnection(workspaceId, onEvent, onError),
    }
}
