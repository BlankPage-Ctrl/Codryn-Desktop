const STORAGE_KEY = 'appearance'

export interface AppearanceBusinessLogic {
    load(): Promise<{ fontSize: number | null; terminalAnimated: boolean | null }>
    save(fontSize: number, terminalAnimated: boolean): Promise<void>
}

export function createAppearanceBusinessLogic(): AppearanceBusinessLogic {
    async function load(): Promise<{ fontSize: number | null; terminalAnimated: boolean | null }> {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                const fontSize = typeof parsed.fontSize === 'number' ? parsed.fontSize : null
                const terminalAnimated =
                    typeof parsed.terminalAnimated === 'boolean' ? parsed.terminalAnimated : null
                if (fontSize !== null || terminalAnimated !== null)
                    return { fontSize, terminalAnimated }
            }
        } catch {
            /* ignore */
        }
        return { fontSize: null, terminalAnimated: null }
    }

    async function save(fontSize: number, terminalAnimated: boolean): Promise<void> {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ fontSize, terminalAnimated }))
        } catch {
            /* ignore */
        }
    }

    return {
        load,
        save,
    }
}
