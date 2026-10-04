import type {
    FEInsightIndexStatus,
    FEInsightSearchParams,
    FEInsightSearchResult,
    FEInsightSyncResult,
} from '@/core/entities'
import type { InsightRepository } from '@/core/repositories'

export interface InsightBusinessLogicDeps {
    repo: InsightRepository
}

export interface InsightBusinessLogic {
    ensure(workspaceId: string): Promise<void>
    sync(workspaceId: string): Promise<string | null>
    index(workspaceId: string): Promise<FEInsightSyncResult>
    indexStatus(workspaceId: string): Promise<FEInsightIndexStatus>
    search(workspaceId: string, params: FEInsightSearchParams): Promise<FEInsightSearchResult>
    setEnabled(workspaceId: string, enabled: boolean): Promise<boolean>
}

export function createInsightBusinessLogic(deps: InsightBusinessLogicDeps): InsightBusinessLogic {
    return {
        ensure: async (workspaceId: string): Promise<void> => {
            await deps.repo.ensure(workspaceId)
        },
        sync: async (workspaceId: string): Promise<string | null> => {
            const res = await deps.repo.sync(workspaceId)
            return res.at || null
        },
        index: (workspaceId) => deps.repo.index(workspaceId),
        indexStatus: (workspaceId) => deps.repo.indexStatus(workspaceId),
        search: (workspaceId, params) => deps.repo.search(workspaceId, params),
        setEnabled: (workspaceId, enabled) => deps.repo.setEnabled(workspaceId, enabled),
    }
}
