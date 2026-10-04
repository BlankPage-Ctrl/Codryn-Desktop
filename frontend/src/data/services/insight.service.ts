import {
    Ensure,
    GetStatus,
    Stop,
    Sync,
    Index,
    IndexStatus,
    Search,
    IsEnabled,
    SetEnabled,
} from '../../../wailsjs/go/insight/Service'
import type {
    FEInsightIndexStatus,
    FEInsightSearchParams,
    FEInsightSearchResult,
    FEInsightStatus,
    FEInsightSyncAccepted,
    FEInsightSyncResult,
} from '@/core/entities'
import type { InsightRepository } from '@/core/repositories'

function toNumber(v: unknown): number {
    return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

function toSyncResult(raw: unknown): FEInsightSyncResult {
    const r = (raw ?? {}) as Record<string, unknown>
    return {
        filesChecked: toNumber(r.filesChecked),
        added: toNumber(r.added),
        modified: toNumber(r.modified),
        removed: toNumber(r.removed),
    }
}

function toIndexStatus(raw: unknown): FEInsightIndexStatus {
    const r = (raw ?? {}) as Record<string, unknown>
    return {
        syncing: r.syncing === true,
        pending: toNumber(r.pending),
        requiresFull: r.requiresFull === true,
    }
}

function toStatus(raw: unknown): FEInsightStatus {
    const r = (raw ?? {}) as Record<string, unknown>
    return {
        workspaceId: typeof r.workspaceId === 'string' ? r.workspaceId : '',
        enabled: r.enabled === true,
        running: r.running === true,
        projectPath: typeof r.projectPath === 'string' ? r.projectPath : '',
    }
}

export const insightRepository: InsightRepository = {
    ensure: async (workspaceId: string) => toStatus((await Ensure(workspaceId)) as unknown),
    status: async (workspaceId: string) => toStatus((await GetStatus(workspaceId)) as unknown),
    stop: async (workspaceId: string): Promise<void> => {
        await Stop(workspaceId)
    },
    sync: async (workspaceId: string): Promise<FEInsightSyncAccepted> => {
        const raw = (await Sync(workspaceId)) as unknown as Record<string, unknown>
        return {
            accepted: raw.accepted === true,
            at: typeof raw.at === 'string' ? raw.at : '',
        }
    },
    index: async (workspaceId: string): Promise<FEInsightSyncResult> => {
        return toSyncResult((await Index(workspaceId, true)) as unknown)
    },
    indexStatus: async (workspaceId: string): Promise<FEInsightIndexStatus> => {
        return toIndexStatus((await IndexStatus(workspaceId)) as unknown)
    },
    search: async (
        workspaceId: string,
        params: FEInsightSearchParams,
    ): Promise<FEInsightSearchResult> => {
        const raw = (await Search(workspaceId, {
            query: params.query,
            mode: params.mode ?? '',
            limit: params.limit ?? 0,
            file: params.file ?? '',
            container: params.container ?? '',
        })) as unknown as Record<string, unknown>
        const hits = Array.isArray(raw.hits) ? raw.hits : []
        return {
            query: typeof raw.query === 'string' ? raw.query : params.query,
            hits: hits as FEInsightSearchResult['hits'],
            stats: (raw.stats ?? {}) as Record<string, number>,
        }
    },
    isEnabled: (workspaceId: string) => IsEnabled(workspaceId) as Promise<boolean>,
    setEnabled: (workspaceId: string, enabled: boolean) =>
        SetEnabled(workspaceId, enabled) as Promise<boolean>,
}
