const THEME_KEY = 'theme-current'
const workspaceThemeKey = (workspaceId: string) => `workspace:${workspaceId}:theme`

export interface ThemePersistence {
    currentId: string | null
}

export interface ThemeBusinessLogic {
    load(): Promise<ThemePersistence>
    saveCurrent(id: string): Promise<void>
    loadWorkspace(workspaceId: string): Promise<ThemePersistence>
    saveWorkspace(workspaceId: string, id: string): Promise<void>
}

export function createThemeBusinessLogic(): ThemeBusinessLogic {
    async function load(): Promise<ThemePersistence> {
        try {
            const raw = localStorage.getItem(THEME_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (typeof parsed.themeId === 'string' && parsed.themeId) {
                    return { currentId: parsed.themeId }
                }
                // fallback plain string
                if (typeof parsed === 'string' && parsed) {
                    return { currentId: parsed }
                }
            }
        } catch {
            /* ignore */
        }
        return { currentId: null }
    }

    async function saveCurrent(id: string): Promise<void> {
        try {
            localStorage.setItem(THEME_KEY, JSON.stringify({ themeId: id }))
        } catch {
            /* ignore */
        }
    }

    async function loadWorkspace(workspaceId: string): Promise<ThemePersistence> {
        try {
            const raw = localStorage.getItem(workspaceThemeKey(workspaceId))
            if (raw) {
                const parsed = JSON.parse(raw)
                if (typeof parsed.themeId === 'string' && parsed.themeId) {
                    return { currentId: parsed.themeId }
                }
                if (typeof parsed === 'string' && parsed) {
                    return { currentId: parsed }
                }
            }
        } catch {
            /* ignore */
        }
        return { currentId: null }
    }

    async function saveWorkspace(workspaceId: string, id: string): Promise<void> {
        try {
            localStorage.setItem(workspaceThemeKey(workspaceId), JSON.stringify({ themeId: id }))
        } catch {
            /* ignore */
        }
    }

    return {
        load,
        saveCurrent,
        loadWorkspace,
        saveWorkspace,
    }
}
