import type { FEDiscoveredPlugin, FEPluginList, FEPluginState } from '@/core/entities'

export interface PluginRepository {
    list(workspaceId: string): Promise<FEPluginList>
    get(workspaceId: string, id: string): Promise<FEPluginState>
    setEnabled(workspaceId: string, id: string, enabled: boolean): Promise<FEPluginState>
    discover(): Promise<FEDiscoveredPlugin[]>
    register(pluginId: string, pluginDir?: string): Promise<{ pluginId: string; enabled: boolean }>
    unregister(pluginId: string): Promise<{ pluginId: string; unregistered: boolean }>
}
