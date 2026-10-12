import type { FEDiscoveredPlugin, FEPluginList, FEPluginState } from '@/core/entities'
import type { PluginRepository } from '@/core/repositories'

export interface PluginBusinessLogicDeps {
    repo: PluginRepository
}

export interface PluginBusinessLogic {
    list(workspaceId: string): Promise<FEPluginList>
    get(workspaceId: string, id: string): Promise<FEPluginState>
    setEnabled(workspaceId: string, id: string, enabled: boolean): Promise<FEPluginState>
    discover(): Promise<FEDiscoveredPlugin[]>
    register(pluginId: string, pluginDir?: string): Promise<{ pluginId: string; enabled: boolean }>
    unregister(pluginId: string): Promise<{ pluginId: string; unregistered: boolean }>
}

export function createPluginBusinessLogic(deps: PluginBusinessLogicDeps): PluginBusinessLogic {
    return {
        list: (workspaceId) => deps.repo.list(workspaceId),
        get: (workspaceId, id) => deps.repo.get(workspaceId, id),
        setEnabled: (workspaceId, id, enabled) => deps.repo.setEnabled(workspaceId, id, enabled),
        discover: () => deps.repo.discover(),
        register: (pluginId, pluginDir) => deps.repo.register(pluginId, pluginDir),
        unregister: (pluginId) => deps.repo.unregister(pluginId),
    }
}
