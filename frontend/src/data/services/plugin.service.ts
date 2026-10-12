import { Discover, Get, List, Register, SetEnabled, Unregister } from '../../../wailsjs/go/plugins/Service'
import type {
    FEDiscoveredPlugin,
    FEPluginCaps,
    FEPluginList,
    FEPluginState,
    FEPluginStatus,
} from '@/core/entities'
import type { PluginRepository } from '@/core/repositories'

function toStatus(v: unknown): FEPluginStatus {
    return v === 'error'
        ? 'error'
        : v === 'disabled'
          ? 'disabled'
          : v === 'not-installed'
            ? 'not-installed'
            : 'ready'
}

function toCaps(raw: unknown): FEPluginCaps | null {
    if (!raw || typeof raw !== 'object') return null
    const r = raw as Record<string, unknown>
    const perms = (r.permissions ?? {}) as Record<string, unknown>
    return {
        format: r.format === 'codryn' ? 'codryn' : 'bare',
        name: typeof r.name === 'string' ? r.name : '',
        description: typeof r.description === 'string' ? r.description : '',
        version: typeof r.version === 'string' ? r.version : null,
        skills: Array.isArray(r.skills) ? r.skills.filter((s): s is string => typeof s === 'string') : [],
        permissions: {
            shell: perms.shell === true,
            network: perms.network === true,
            sensitive: perms.sensitive === true,
        },
        bootstrap: typeof r.bootstrap === 'string' ? r.bootstrap : null,
        tools: Array.isArray(r.tools)
            ? r.tools.filter((t): t is Record<string, unknown> => !!t && typeof t === 'object')
            : [],
        notices: Array.isArray(r.notices)
            ? r.notices.filter((n): n is string => typeof n === 'string')
            : [],
    }
}

function toPluginState(raw: unknown): FEPluginState {
    const r = (raw ?? {}) as Record<string, unknown>
    return {
        id: typeof r.id === 'string' ? r.id : '',
        path: typeof r.path === 'string' ? r.path : null,
        source: typeof r.source === 'string' ? r.source : 'local',
        enabled: r.enabled !== false,
        status: toStatus(r.status),
        error: typeof r.error === 'string' && r.error !== '' ? r.error : null,
        caps: toCaps(r.caps),
    }
}

function toDiscovered(raw: unknown): FEDiscoveredPlugin {
    const r = (raw ?? {}) as Record<string, unknown>
    return {
        id: typeof r.id === 'string' ? r.id : '',
        dir: typeof r.dir === 'string' ? r.dir : '',
        registered: r.registered === true,
        enabled: r.enabled !== false,
        manifestValid: r.manifestValid === true,
        notices: Array.isArray(r.notices)
            ? r.notices.filter((n): n is string => typeof n === 'string')
            : [],
    }
}

export const pluginsRepository: PluginRepository = {
    list: async (workspaceId: string): Promise<FEPluginList> => {
        const raw = (await List(workspaceId)) as unknown as Record<string, unknown>
        const plugins = Array.isArray(raw.plugins) ? raw.plugins : []
        return {
            workspaceId: typeof raw.workspaceId === 'string' ? raw.workspaceId : workspaceId,
            plugins: plugins.map(toPluginState),
        }
    },
    get: async (workspaceId: string, id: string): Promise<FEPluginState> => {
        const raw = (await Get(workspaceId, id)) as unknown as Record<string, unknown>
        return toPluginState(raw.plugin)
    },
    setEnabled: async (
        workspaceId: string,
        id: string,
        enabled: boolean,
    ): Promise<FEPluginState> => {
        const raw = (await SetEnabled(workspaceId, id, enabled)) as unknown as Record<
            string,
            unknown
        >
        return toPluginState(raw.plugin)
    },
    discover: async (): Promise<FEDiscoveredPlugin[]> => {
        const raw = (await Discover()) as unknown as Record<string, unknown>
        const plugins = Array.isArray(raw.plugins) ? raw.plugins : []
        return plugins.map(toDiscovered)
    },
    register: async (
        pluginId: string,
        pluginDir?: string,
    ): Promise<{ pluginId: string; enabled: boolean }> => {
        const raw = (await Register(pluginId, pluginDir ?? '')) as unknown as Record<
            string,
            unknown
        >
        return {
            pluginId: typeof raw.pluginId === 'string' ? raw.pluginId : pluginId,
            enabled: raw.enabled !== false,
        }
    },
    unregister: async (pluginId: string): Promise<{ pluginId: string; unregistered: boolean }> => {
        const raw = (await Unregister(pluginId)) as unknown as Record<string, unknown>
        return {
            pluginId: typeof raw.pluginId === 'string' ? raw.pluginId : pluginId,
            unregistered: raw.unregistered !== false,
        }
    },
}
