import type {
    FEInsightIndexStatus,
    FEInsightSearchParams,
    FEInsightSearchResult,
    FEInsightStatus,
    FEInsightSyncAccepted,
    FEInsightSyncResult,
} from '@/core/entities'

export interface InsightRepository {
    ensure(workspaceId: string): Promise<FEInsightStatus>
    status(workspaceId: string): Promise<FEInsightStatus>
    stop(workspaceId: string): Promise<void>
    sync(workspaceId: string): Promise<FEInsightSyncAccepted>
    index(workspaceId: string): Promise<FEInsightSyncResult>
    indexStatus(workspaceId: string): Promise<FEInsightIndexStatus>
    search(workspaceId: string, params: FEInsightSearchParams): Promise<FEInsightSearchResult>
    isEnabled(workspaceId: string): Promise<boolean>
    setEnabled(workspaceId: string, enabled: boolean): Promise<boolean>
}
