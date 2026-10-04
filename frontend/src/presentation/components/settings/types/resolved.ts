import type { Provider } from '@/core/entities'
import type { SettingsTheme, PresetOption } from './schema'

export type { SettingsTabSchema, SettingsTheme, PresetOption } from './schema'

export interface ResolvedSettingsTab {
    provider: ResolvedProviderSection
    appearance: ResolvedAppearanceSection
    theme: ResolvedThemeSection
    terminal: ResolvedTerminalSection
}

export interface ResolvedProviderSection {
    providers: Provider[]
    loading: boolean
    error: string | null
    defaultProviderId: string | null
    defaultModelId: string | null
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
}

export interface ResolvedAppearanceSection {
    preset: string
    fontSize: number
    presets: readonly PresetOption[]
    onUpdatePreset?: (preset: string) => void
    onUpdateFontSize?: (size: number) => void
}

export interface ResolvedThemeSection {
    themes: SettingsTheme[]
    activeThemeId: string | null
    onSetActiveTheme?: (id: string) => void
}

export interface ResolvedTerminalSection {
    animated: boolean
    onToggle?: (v: boolean) => void
}
