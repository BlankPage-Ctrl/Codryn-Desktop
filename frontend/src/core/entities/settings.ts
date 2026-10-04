export interface SettingsValue {
    key: string
    value: string | null
}

export interface DefaultProvider {
    providerId: string | null
    modelId: string | null
}

export interface ThemeValue {
    themeId?: string
}

export interface WorkspaceThemeValue {
    themeId?: string
}
