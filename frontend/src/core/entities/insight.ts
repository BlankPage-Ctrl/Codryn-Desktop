export type FEInsightSearchMode = 'auto' | 'exact' | 'prefix' | 'substring' | 'fts'

export interface FEInsightSearchHit {
    id: string
    name: string
    kind: string
    filePath: string
    lineRange: { start: number; end: number }
}

export interface FEInsightSearchResult {
    query: string
    hits: FEInsightSearchHit[]
    stats: Record<string, number>
}

export interface FEInsightSearchParams {
    query: string
    mode?: FEInsightSearchMode
    limit?: number
    file?: string
    container?: string
}

export interface FEInsightSyncAccepted {
    accepted: boolean
    at: string
}

export interface FEInsightSyncResult {
    filesChecked: number
    added: number
    modified: number
    removed: number
}

export interface FEInsightIndexStatus {
    syncing: boolean
    pending: number
    requiresFull: boolean
}

export interface FEInsightStatus {
    workspaceId: string
    enabled: boolean
    running: boolean
    projectPath: string
}
