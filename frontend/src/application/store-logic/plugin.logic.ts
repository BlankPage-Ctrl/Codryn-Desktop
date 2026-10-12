import type { FEDiscoveredPlugin, FEPluginState } from '@/core/entities'
import type { PluginStorer } from '../stores/plugin.storer'

export interface PluginStoreLogic {
    selectWorkspace(id: string | null): void
    beginLoad(): void
    endLoad(plugins: FEPluginState[]): void
    setError(message: string | null): void
    beginToggle(id: string): void
    endToggle(plugin: FEPluginState): void
    failToggle(id: string): void
    endDiscover(plugins: FEDiscoveredPlugin[]): void
}

export function createPluginStoreLogic(getStorer: () => PluginStorer): PluginStoreLogic {
    return {
        selectWorkspace: (id) => getStorer().selectWorkspace(id),
        beginLoad: () => {
            getStorer().loading = true
            getStorer().error = null
        },
        endLoad: (plugins) => {
            const storer = getStorer()
            storer.loading = false
            storer.plugins = plugins
        },
        setError: (message) => {
            getStorer().error = message
        },
        beginToggle: (id) => {
            getStorer().toggling = { ...getStorer().toggling, [id]: true }
        },
        endToggle: (plugin) => {
            const storer = getStorer()
            const { [plugin.id]: _dropped, ...rest } = storer.toggling
            storer.toggling = rest
            storer.plugins = storer.plugins.map((p) => (p.id === plugin.id ? plugin : p))
        },
        failToggle: (id) => {
            const storer = getStorer()
            const { [id]: _dropped, ...rest } = storer.toggling
            storer.toggling = rest
        },
        endDiscover: (plugins) => {
            const storer = getStorer()
            storer.loading = false
            storer.discovered = plugins
        },
    }
}
