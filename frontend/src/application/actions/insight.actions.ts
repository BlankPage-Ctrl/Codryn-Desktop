import type { InsightStoreLogic } from '../store-logic/insight.logic'
import type { InsightBusinessLogic } from '../business-logic/insight.logic'
import type {
    FEInsightSearchParams,
    FEInsightSearchResult,
    FEInsightSyncResult,
} from '@/core/entities'
import { toMessage } from '@/shared/utils/error.utils'

export interface InsightActions {
    ensureOnSelect(workspaceId: string | null): Promise<void>
    sync(workspaceId: string): Promise<void>
    index(workspaceId: string): Promise<FEInsightSyncResult | null>
    refreshIndexStatus(workspaceId: string): Promise<void>
    search(
        workspaceId: string,
        params: FEInsightSearchParams,
    ): Promise<FEInsightSearchResult | null>
    setEnabled(workspaceId: string, enabled: boolean): Promise<void>
}

export function createInsightActions(
    storeLogic: InsightStoreLogic,
    businessLogic: InsightBusinessLogic,
): InsightActions {
    async function ensureOnSelect(workspaceId: string | null): Promise<void> {
        storeLogic.selectWorkspace(workspaceId)
        if (!workspaceId) return
        try {
            storeLogic.beginLoad()
            await businessLogic.ensure(workspaceId)
            storeLogic.setRunning(true)
            storeLogic.setEnabled(true)
        } catch (e: unknown) {
            const msg = toMessage(e) || 'Failed to ensure insight'
            // Disabled or daemon-down (binary/permission/crash): never leave
            // the toggle ON. The backend keeps running, only Insight is off.
            if (
                /disabled|binary|not running|spawn|EACCES|EPERM|permission|chmod|write failed|destroyed|exited/i.test(
                    msg,
                )
            ) {
                storeLogic.setEnabled(false)
                storeLogic.setRunning(false)
                storeLogic.setError(msg)
            } else {
                storeLogic.setError(msg)
            }
        } finally {
            storeLogic.endLoad()
        }
    }

    async function sync(workspaceId: string): Promise<void> {
        storeLogic.beginSync()
        try {
            const at = await businessLogic.sync(workspaceId)
            storeLogic.endSync(at ?? undefined)
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to sync insight')
            storeLogic.endSync()
        }
    }

    async function index(workspaceId: string): Promise<FEInsightSyncResult | null> {
        storeLogic.beginSync()
        try {
            const res = await businessLogic.index(workspaceId)
            storeLogic.endSync()
            return res
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to index insight')
            storeLogic.endSync()
            return null
        }
    }

    async function refreshIndexStatus(workspaceId: string): Promise<void> {
        try {
            const status = await businessLogic.indexStatus(workspaceId)
            storeLogic.setIndexStatus(status)
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to fetch insight index status')
        }
    }

    async function search(
        workspaceId: string,
        params: FEInsightSearchParams,
    ): Promise<FEInsightSearchResult | null> {
        try {
            return await businessLogic.search(workspaceId, params)
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Insight search failed')
            return null
        }
    }

    async function setEnabled(workspaceId: string, enabled: boolean): Promise<void> {
        // Pessimistic toggle: the store only flips after the backend answers.
        if (!enabled) {
            try {
                const applied = await businessLogic.setEnabled(workspaceId, false)
                storeLogic.setEnabled(applied)
                storeLogic.setRunning(false)
            } catch (e: unknown) {
                storeLogic.setError(toMessage(e) || 'Failed to update insight setting')
            }
            return
        }
        try {
            storeLogic.beginLoad()
            await businessLogic.setEnabled(workspaceId, true)
        } catch (e: unknown) {
            storeLogic.setEnabled(false)
            storeLogic.setRunning(false)
            storeLogic.setError(toMessage(e) || 'Failed to update insight setting')
            storeLogic.endLoad()
            return
        }
        try {
            await businessLogic.ensure(workspaceId)
            storeLogic.setEnabled(true)
            storeLogic.setRunning(true)
        } catch (e: unknown) {
            const msg = toMessage(e) || 'Failed to ensure insight'
            // Roll the persisted intent back so backend and UI agree: off.
            await businessLogic.setEnabled(workspaceId, false).catch(() => false)
            storeLogic.setEnabled(false)
            storeLogic.setRunning(false)
            storeLogic.setError(msg)
        } finally {
            storeLogic.endLoad()
        }
    }

    return { ensureOnSelect, sync, index, refreshIndexStatus, search, setEnabled }
}
