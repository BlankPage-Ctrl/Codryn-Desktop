import type { SettingsTabSchema } from '../types/schema'
import type { ResolvedSettingsTab } from '../types/resolved'

export function resolveSettingsTabSchema(schema: SettingsTabSchema): ResolvedSettingsTab {
    return {
        provider: {
            providers: schema.providers,
            loading: schema.loading,
            error: schema.error,
            defaultProviderId: schema.defaultProviderId,
            defaultModelId: schema.defaultModelId,
            onAddProvider: schema.onAddProvider,
            onEditProvider: schema.onEditProvider,
            onDeleteProvider: schema.onDeleteProvider,
            onAddModel: schema.onAddModel,
            onEditModel: schema.onEditModel,
            onDeleteModel: schema.onDeleteModel,
            onSetDefault: schema.onSetDefault,
        },
        appearance: {
            preset: schema.preset,
            fontSize: schema.fontSize,
            presets: schema.presets,
            onUpdatePreset: schema.onUpdatePreset,
            onUpdateFontSize: schema.onUpdateFontSize,
        },
        theme: {
            themes: schema.themes,
            activeThemeId: schema.activeThemeId,
            onSetActiveTheme: schema.onSetActiveTheme,
        },
        terminal: {
            animated: schema.terminalAnimated,
            onToggle: schema.onToggleTerminalAnimated,
        },
    }
}
