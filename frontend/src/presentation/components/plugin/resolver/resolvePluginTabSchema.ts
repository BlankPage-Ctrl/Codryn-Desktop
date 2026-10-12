import type { PluginTabSchema } from '../types/schema'
import type { ResolvedPluginTab } from '../types/resolved'

export function resolvePluginTabSchema(schema: PluginTabSchema): ResolvedPluginTab {
    return {
        discovered: schema.discovered,
        states: schema.states,
        loading: schema.loading,
        error: schema.error,
        onDiscover: schema.onDiscover,
        onRegister: schema.onRegister,
        onUnregister: schema.onUnregister,
        onToggle: schema.onToggle,
    }
}
