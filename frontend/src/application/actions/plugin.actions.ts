import type { PluginStoreLogic } from '../store-logic/plugin.logic'
import type { PluginBusinessLogic } from '../business-logic/plugin.logic'
import { toMessage } from '@/shared/utils/error.utils'

export interface PluginActions {
    refreshOnSelect(workspaceId: string | null): Promise<void>
    refresh(workspaceId: string): Promise<void>
    setEnabled(workspaceId: string, id: string, enabled: boolean): Promise<void>
    discover(): Promise<void>
    register(pluginId: string, pluginDir?: string): Promise<void>
    unregister(pluginId: string): Promise<void>
}

export function createPluginActions(
    storeLogic: PluginStoreLogic,
    businessLogic: PluginBusinessLogic,
): PluginActions {
    async function load(workspaceId: string): Promise<void> {
        try {
            storeLogic.beginLoad()
            const list = await businessLogic.list(workspaceId)
            storeLogic.endLoad(list.plugins)
        } catch (e: unknown) {
            storeLogic.endLoad([])
            storeLogic.setError(toMessage(e) || 'Failed to load plugins')
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

    async function setEnabled(workspaceId: string, id: string, enabled: boolean): Promise<void> {
        storeLogic.beginToggle(id)
        try {
            const plugin = await businessLogic.setEnabled(workspaceId, id, enabled)
            storeLogic.endToggle(plugin)
        } catch (e: unknown) {
            storeLogic.failToggle(id)
            storeLogic.setError(
                toMessage(e) || `Failed to ${enabled ? 'enable' : 'disable'} ${id}`,
            )
        }
    }

    async function discover(): Promise<void> {
        try {
            storeLogic.beginLoad()
            const plugins = await businessLogic.discover()
            storeLogic.endDiscover(plugins)
        } catch (e: unknown) {
            storeLogic.endDiscover([])
            storeLogic.setError(toMessage(e) || 'Failed to discover plugins')
        }
    }

    async function register(pluginId: string, pluginDir?: string): Promise<void> {
        try {
            storeLogic.beginLoad()
            await businessLogic.register(pluginId, pluginDir)
            storeLogic.endDiscover(await businessLogic.discover())
        } catch (e: unknown) {
            storeLogic.endDiscover([])
            storeLogic.setError(toMessage(e) || `Failed to register ${pluginId}`)
        }
    }

    async function unregister(pluginId: string): Promise<void> {
        try {
            storeLogic.beginLoad()
            await businessLogic.unregister(pluginId)
            storeLogic.endDiscover(await businessLogic.discover())
        } catch (e: unknown) {
            storeLogic.endDiscover([])
            storeLogic.setError(toMessage(e) || `Failed to unregister ${pluginId}`)
        }
    }

    return { refreshOnSelect, refresh, setEnabled, discover, register, unregister }
}
