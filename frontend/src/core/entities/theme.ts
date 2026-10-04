export interface ThemeColors {
    bgPrimary: string
    bgSecondary: string
    border: string
    textPrimary: string
    success: string
    danger: string
    shadow: string
}

export interface ThemeSchema {
    id: string
    name: string
    description?: string
    colors: ThemeColors
}

export interface ThemeMeta {
    id: string
    name: string
    description?: string
    builtIn: boolean
}

export const BUILT_IN_THEMES: ThemeSchema[] = [
    {
        id: 'ola',
        name: 'Ola',
        description: 'Warm cream beige — current default',
        colors: {
            bgPrimary: '255, 250, 243',
            bgSecondary: '255, 242, 219',
            border: '242, 210, 160',
            textPrimary: '19, 16, 16',
            success: '34, 197, 93',
            danger: '246, 36, 64',
            shadow: '200, 180, 150',
        },
    },
    {
        id: 'day',
        name: 'Day',
        description: 'Clean white, crisp and minimal',
        colors: {
            bgPrimary: '255, 255, 255',
            bgSecondary: '248, 249, 250',
            border: '215, 220, 228',
            textPrimary: '33, 37, 41',
            success: '34, 197, 93',
            danger: '246, 36, 64',
            shadow: '180, 180, 180',
        },
    },
    {
        id: 'night',
        name: 'Night',
        description: 'Dark mode, easy on the eyes',
        colors: {
            bgPrimary: '38, 38, 38',
            bgSecondary: '33, 33, 33',
            border: '68, 68, 80',
            textPrimary: '215, 215, 225',
            success: '68, 220, 120',
            danger: '255, 90, 110',
            shadow: '90, 90, 100',
        },
    },
]

export function getTheme(id: string): ThemeSchema | undefined {
    return BUILT_IN_THEMES.find((t) => t.id === id)
}

export function getThemePreview(id: string): ThemeColors | undefined {
    const theme = getTheme(id)
    return theme ? { ...theme.colors } : undefined
}
