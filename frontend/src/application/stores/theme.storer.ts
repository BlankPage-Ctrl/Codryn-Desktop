import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { BUILT_IN_THEMES, type ThemeMeta } from '@/core/entities'

export const useThemeStorer = defineStore('theme', () => {
    const activeThemeId = ref('ola')

    const availableThemes = computed<ThemeMeta[]>(() =>
        BUILT_IN_THEMES.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            builtIn: true,
        })),
    )

    const activeTheme = computed(() => {
        const builtIn = BUILT_IN_THEMES.find((t) => t.id === activeThemeId.value)
        return builtIn ?? BUILT_IN_THEMES[0]
    })

    function setActiveThemeId(id: string): void {
        activeThemeId.value = id
    }

    return {
        activeThemeId,
        availableThemes,
        activeTheme,
        setActiveThemeId,
    }
})

export type ThemeStorer = ReturnType<typeof useThemeStorer>
