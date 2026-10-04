export type RelPath = string
export type AbsPath = string

export type FENodeType = 'file' | 'directory' | 'symlink'

export interface FEFileNode {
    id: string
    name: string
    path: RelPath
    type: FENodeType
    isDirectory: boolean
    size?: number
    lastModified?: number
    hasChildren?: boolean
    children?: RelPath[]
    symlink?: {
        target: RelPath | AbsPath
    }
}

export type FELoadState = 'idle' | 'loading' | 'loaded' | 'error'

export interface FETreeItem {
    node: FEFileNode
    depth: number
    isExpanded: boolean
    isLoading: boolean
    isSelected: boolean
}

export type FEWatchEventType = 'CREATED' | 'DELETED' | 'MODIFIED' | 'MOVED'

export interface FEWatchEvent {
    type: FEWatchEventType
    node: FEFileNode
    oldPath?: RelPath
    timestamp: number
}

export interface FEListDirData {
    requestedPath: RelPath
    nodes: FEFileNode[]
}

export interface FESearchData {
    query: string
    matches: FEFileNode[]
}

export interface FESearchOptions {
    path?: RelPath
    maxResults?: number
    maxDepth?: number
}

export interface FEMeta {
    totalNodes?: number
    requestedPath?: RelPath
    workspaceRoot?: AbsPath
}
