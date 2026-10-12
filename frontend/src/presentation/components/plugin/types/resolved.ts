import type { FEDiscoveredPlugin } from '@/core/entities'

export interface ResolvedPluginTab {
    discovered: FEDiscoveredPlugin[]
    loading: boolean
    error: string | null
    onDiscover: () => void
    onRegister: (pluginId: string, pluginDir: string) => void
    onUnregister: (pluginId: string) => void
    onToggle: (id: string, enabled: boolean) => void
}
