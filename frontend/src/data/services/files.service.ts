import {
    ListDir,
    GetStat,
    ReadFile,
    Search,
    PickDirectory,
} from '../../../wailsjs/go/files/Service'
import type { FEFileNode, FEListDirData, FESearchData, FESearchOptions } from '@/core/entities'
import type { FileRepository } from '@/core/repositories'

interface BackendFileNode {
    id: string
    name: string
    path: string
    type: string
    isDirectory: boolean
    size?: number
    lastModified?: number
    hasChildren?: boolean
    children?: BackendFileNode[]
    meta?: {
        isSymlink?: boolean
        symlinkTarget?: string
    }
}

interface BackendListDirData {
    requestedPath: string
    nodes: BackendFileNode[]
}

interface BackendGetStatData {
    node: BackendFileNode
}

interface BackendReadFileData {
    path: string
    content: string
    encoding: string
    size: number
    truncated: boolean
}

interface BackendSearchFilesData {
    query: string
    matches: BackendFileNode[]
}

function toFEFileNode(n: BackendFileNode): FEFileNode {
    return {
        id: n.id,
        name: n.name,
        path: n.path,
        type: n.type.toLowerCase() as FEFileNode['type'],
        isDirectory: n.isDirectory,
        size: n.size,
        lastModified: n.lastModified,
        hasChildren: n.hasChildren,
        children: n.children?.map((c) => c.path),
        symlink: n.meta?.symlinkTarget ? { target: n.meta.symlinkTarget } : undefined,
    }
}

function toFEListDirData(data: BackendListDirData): FEListDirData {
    return {
        requestedPath: data.requestedPath,
        nodes: data.nodes.map(toFEFileNode),
    }
}

function toFESearchData(data: BackendSearchFilesData): FESearchData {
    return {
        query: data.query,
        matches: data.matches.map(toFEFileNode),
    }
}

export function pickDirectory(title?: string, defaultDirectory?: string): Promise<string> {
    return PickDirectory(title ?? '', defaultDirectory ?? '')
}

export const filesRepository: FileRepository = {
    listDir: (workspaceId: string, path: string) =>
        ListDir(workspaceId, path).then(toFEListDirData),

    getStat: (workspaceId: string, path: string) =>
        GetStat(workspaceId, path) as Promise<BackendGetStatData>,

    readFile: (workspaceId: string, path: string, maxBytes?: number) =>
        ReadFile(workspaceId, path, maxBytes ?? null) as Promise<BackendReadFileData>,

    searchFiles: (workspaceId: string, query: string, opts?: FESearchOptions) =>
        Search(
            workspaceId,
            opts?.path ?? '',
            query,
            opts?.maxResults ?? null,
            opts?.maxDepth ?? null,
        ).then(toFESearchData),
}
