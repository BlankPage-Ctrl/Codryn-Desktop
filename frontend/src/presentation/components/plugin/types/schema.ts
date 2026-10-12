import type { FEDiscoveredPlugin, FEPluginState } from '@/core/entities'

export interface PluginTabSchema {
    discovered: FEDiscoveredPlugin[]
    states: FEPluginState[]
    loading: boolean
    error: string | null
    workspaceId: string
    onDiscover: () => void
    onRegister: (pluginId: string, pluginDir: string) => void
    onUnregister: (pluginId: string) => void
    onToggle: (id: string, enabled: boolean) => void
}
