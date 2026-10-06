import type { McpStoreLogic } from '../store-logic/mcp.logic'
import type { McpBusinessLogic } from '../business-logic/mcp.logic'
import { toMessage } from '@/shared/utils/error.utils'

export interface McpActions {
    refreshOnSelect(workspaceId: string | null): Promise<void>
    refresh(workspaceId: string): Promise<void>
    setEnabled(workspaceId: string, name: string, enabled: boolean): Promise<void>
}

export function createMcpActions(
    storeLogic: McpStoreLogic,
    businessLogic: McpBusinessLogic,
): McpActions {
    async function load(workspaceId: string): Promise<void> {
        try {
            storeLogic.beginLoad()
            const list = await businessLogic.list(workspaceId)
            storeLogic.endLoad(list.servers, list.source)
        } catch (e: unknown) {
            storeLogic.endLoad([], '')
            storeLogic.setError(toMessage(e) || 'Failed to load MCP servers')
        }
    }

    async function refreshOnSelect(workspaceId: string | null): Promise<void> {
        storeLogic.selectWorkspace(workspaceId)
        if (!workspaceId) return
        await load(workspaceId)
    }

    async function refresh(workspaceId: string): Promise<void> {
        await load(workspaceId)
    }

    async function setEnabled(workspaceId: string, name: string, enabled: boolean): Promise<void> {
        storeLogic.beginToggle(name)
        try {
            const server = await businessLogic.setEnabled(workspaceId, name, enabled)
            storeLogic.endToggle(server)
        } catch (e: unknown) {
            storeLogic.failToggle(name)
            storeLogic.setError(
                toMessage(e) || `Failed to ${enabled ? 'enable' : 'disable'} ${name}`,
            )
        }
    }

    return { refreshOnSelect, refresh, setEnabled }
}
