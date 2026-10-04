import { getThemePreview as coreGetThemePreview, type ThemeColors } from '@/core/entities'
import type { ThemeStorer } from '../stores/theme.storer'

export interface ThemeStoreLogic {
    setActiveThemeId(id: string): void
    getThemePreview(id: string): ThemeColors | undefined
}

export function createThemeStoreLogic(getStorer: () => ThemeStorer): ThemeStoreLogic {
    function applyTheme(id: string): void {
        document.documentElement.dataset.theme = id
    }

    function setActiveThemeId(id: string): void {
        getStorer().setActiveThemeId(id)
        applyTheme(id)
    }

    function getThemePreview(id: string): ThemeColors | undefined {
        return coreGetThemePreview(id)
    }

    return {
        setActiveThemeId,
        getThemePreview,
    }
}
