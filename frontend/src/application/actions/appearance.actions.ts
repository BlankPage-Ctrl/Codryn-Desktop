import type { AppearanceStoreLogic } from '../store-logic/appearance.logic'
import type { AppearanceBusinessLogic } from '../business-logic/appearance.logic'

export interface AppearanceActions {
    load(): Promise<void>
    setPreset(label: string): void
    setFontSize(size: number): void
    setTerminalAnimated(v: boolean): void
}

export function createAppearanceActions(
    storeLogic: AppearanceStoreLogic,
    businessLogic: AppearanceBusinessLogic,
): AppearanceActions {
    let loaded = false

    async function load(): Promise<void> {
        const data = await businessLogic.load()
        if (data.fontSize !== null) storeLogic.setFontSize(data.fontSize)
        if (data.terminalAnimated !== null) storeLogic.setTerminalAnimated(data.terminalAnimated)
        loaded = true
    }

    function persist(): void {
        void businessLogic.save(storeLogic.getFontSize(), storeLogic.getTerminalAnimated())
    }

    function setPreset(label: string): void {
        storeLogic.setPreset(label)
        if (loaded) persist()
    }

    function setFontSize(size: number): void {
        storeLogic.setFontSize(size)
        if (loaded) persist()
    }

    function setTerminalAnimated(v: boolean): void {
        storeLogic.setTerminalAnimated(v)
        if (loaded) persist()
    }

    return {
        load,
        setPreset,
        setFontSize,
        setTerminalAnimated,
    }
}
