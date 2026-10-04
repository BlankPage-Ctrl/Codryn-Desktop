import type { Provider, ThemeMeta } from '@/core/entities'

export interface SettingsTheme extends ThemeMeta {
    swatches: string[]
}

export interface PresetOption {
    readonly label: string
    readonly fontSize: number
}

export interface SettingsTabSchema {
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
