import type { FEDiscoveredPlugin, FEPluginState } from '@/core/entities'

export interface ResolvedPluginTab {
    discovered: FEDiscoveredPlugin[]
    states: FEPluginState[]
    loading: boolean
    error: string | null
    onDiscover: () => void
    onRegister: (pluginId: string, pluginDir: string) => void
    onUnregister: (pluginId: string) => void
    onToggle: (id: string, enabled: boolean) => void
}
