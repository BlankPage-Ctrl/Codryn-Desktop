import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { APPEARANCE_PRESETS } from '@/core/entities'

const TERMINAL_DEFAULT_ANIMATED = true

function loadTerminalAnimated(): boolean {
    try {
        const raw = localStorage.getItem('appearance')
        if (raw) {
            const parsed = JSON.parse(raw)
            if (typeof parsed.terminalAnimated === 'boolean') return parsed.terminalAnimated
        }
    } catch {
        /* ignore */
    }
    return TERMINAL_DEFAULT_ANIMATED
}

export const useAppearanceStorer = defineStore('appearance', () => {
    const fontSize = ref(14)
    const terminalAnimated = ref<boolean>(loadTerminalAnimated())

    const lineHeight = computed(() => 1.0 + fontSize.value / 20)
    const contentWidth = computed(() => 500 + fontSize.value * 20)

    const preset = computed(() => {
        const match = APPEARANCE_PRESETS.find((p) => p.fontSize === fontSize.value)
        return match ? match.label : 'Custom'
    })

    function setFontSize(v: number): void {
        fontSize.value = v
    }

    function setTerminalAnimated(v: boolean): void {
        terminalAnimated.value = v
    }

    return {
        fontSize,
        lineHeight,
        contentWidth,
        preset,
        terminalAnimated,
        setFontSize,
        setTerminalAnimated,
    }
})

export type AppearanceStorer = ReturnType<typeof useAppearanceStorer>
