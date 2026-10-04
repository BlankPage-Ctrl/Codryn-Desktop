import type { ThemeStoreLogic } from '../store-logic/theme.logic'
import type { ThemeBusinessLogic } from '../business-logic/theme.logic'
import type { ThemeColors } from '@/core/entities'

export interface ThemeActions {
    load(): Promise<void>
    setTheme(id: string): void
    getThemePreview(id: string): ThemeColors | undefined
}

export function createThemeActions(
    storeLogic: ThemeStoreLogic,
    businessLogic: ThemeBusinessLogic,
): ThemeActions {
    let loaded = false

    async function load(): Promise<void> {
        const persistence = await businessLogic.load()
        storeLogic.setActiveThemeId(persistence.currentId ?? 'ola')
        loaded = true
    }

    function setTheme(id: string): void {
        storeLogic.setActiveThemeId(id)
        if (loaded) {
            businessLogic.saveCurrent(id)
        }
    }

    function getThemePreview(id: string): ThemeColors | undefined {
        return storeLogic.getThemePreview(id)
    }

    return {
        load,
        setTheme,
        getThemePreview,
    }
}
