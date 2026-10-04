import type {
    SettingsTabSchema,
    SettingsTheme,
    PresetOption,
} from '@/presentation/components/settings/types/schema'
import type { Provider } from '@/core/entities'

export interface SettingsTabParams {
    providers: Provider[]
    loading: boolean
    error: string | null
    defaultProviderId: string | null
    defaultModelId: string | null
    preset: string
    fontSize: number
    themes: SettingsTheme[]
    activeThemeId: string | null
    presets: readonly PresetOption[]
    terminalAnimated: boolean
    onAddProvider?: () => void
    onEditProvider?: (provider: Provider) => void
    onDeleteProvider?: (id: string) => void
    onAddModel?: (providerId: string) => void
    onEditModel?: (
        providerId: string,
        modelId: string,
        data: {
            modelId: string
            displayName?: string
            maxInputTokens?: number
            maxOutputTokens?: number
        },
    ) => void
    onDeleteModel?: (providerId: string, modelId: string) => void
    onSetDefault?: (providerId: string, modelId: string) => void
    onUpdatePreset?: (preset: string) => void
    onUpdateFontSize?: (size: number) => void
    onSetActiveTheme?: (id: string) => void
    onToggleTerminalAnimated?: (v: boolean) => void
    onClose?: () => void
}

export function createSettingsTabSchema(params: SettingsTabParams): SettingsTabSchema {
    return {
        providers: params.providers,
        loading: params.loading,
        error: params.error,
        defaultProviderId: params.defaultProviderId,
        defaultModelId: params.defaultModelId,
        preset: params.preset,
        fontSize: params.fontSize,
        themes: params.themes,
        activeThemeId: params.activeThemeId,
        presets: params.presets,
        terminalAnimated: params.terminalAnimated,
        onAddProvider: params.onAddProvider,
        onEditProvider: params.onEditProvider,
        onDeleteProvider: params.onDeleteProvider,
        onAddModel: params.onAddModel,
        onEditModel: params.onEditModel,
        onDeleteModel: params.onDeleteModel,
        onSetDefault: params.onSetDefault,
        onUpdatePreset: params.onUpdatePreset,
        onUpdateFontSize: params.onUpdateFontSize,
        onSetActiveTheme: params.onSetActiveTheme,
        onToggleTerminalAnimated: params.onToggleTerminalAnimated,
        onClose: params.onClose,
    }
}
