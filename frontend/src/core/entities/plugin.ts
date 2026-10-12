export type FEPluginStatus = 'ready' | 'not-installed' | 'error' | 'disabled'

export interface FEPluginPermissions {
    shell: boolean
    network: boolean
    sensitive: boolean
}

export interface FEPluginCaps {
    format: 'codryn' | 'bare'
    name: string
    description: string
    version: string | null
    skills: string[]
    permissions: FEPluginPermissions
    bootstrap: string | null
    tools: Record<string, unknown>[]
    notices: string[]
}

export interface FEPluginState {
    id: string
    path: string | null
    source: string
    enabled: boolean
    status: FEPluginStatus
    error: string | null
    caps: FEPluginCaps | null
}

export interface FEDiscoveredPlugin {
    id: string
    dir: string
    registered: boolean
    enabled: boolean
    manifestValid: boolean
    notices: string[]
}

export interface FEPluginList {
    workspaceId: string
    plugins: FEPluginState[]
}
