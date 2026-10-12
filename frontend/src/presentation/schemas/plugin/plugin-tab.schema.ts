import type { FEDiscoveredPlugin } from '@/core/entities'

export interface PluginTabParams {
    discovered: FEDiscoveredPlugin[]
    loading: boolean
    error: string | null
    workspaceId: string
    onDiscover: () => void
    onRegister: (pluginId: string, pluginDir: string) => void
    onUnregister: (pluginId: string) => void
    onToggle: (id: string, enabled: boolean) => void
}

export interface PluginTabSchema {
    discovered: FEDiscoveredPlugin[]
    loading: boolean
    error: string | null
    workspaceId: string
    onDiscover: () => void
    onRegister: (pluginId: string, pluginDir: string) => void
    onUnregister: (pluginId: string) => void
    onToggle: (id: string, enabled: boolean) => void
}

export function createPluginTabSchema(params: PluginTabParams): PluginTabSchema {
    return {
        discovered: params.discovered,
        loading: params.loading,
        error: params.error,
        workspaceId: params.workspaceId,
        onDiscover: params.onDiscover,
        onRegister: params.onRegister,
        onUnregister: params.onUnregister,
        onToggle: params.onToggle,
    }
}
