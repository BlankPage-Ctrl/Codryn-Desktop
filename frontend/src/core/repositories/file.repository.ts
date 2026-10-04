import type { FESearchData, FESearchOptions, FEListDirData, FEWatchEvent } from '../entities/file'

export interface FileRepository {
    listDir(workspaceId: string, path: string): Promise<FEListDirData>
    getStat(workspaceId: string, path: string): Promise<unknown>
    readFile(workspaceId: string, path: string, maxBytes?: number): Promise<unknown>
    searchFiles(workspaceId: string, query: string, opts?: FESearchOptions): Promise<FESearchData>
}

export interface FileWatchPort {
    createWatchConnection(
        workspaceId: string,
        onEvent: (event: FEWatchEvent) => void,
        onError?: (error: Event) => void,
    ): () => void
}
