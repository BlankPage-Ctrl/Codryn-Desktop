import {
    Quit,
    WindowIsMaximised,
    WindowMinimise,
    WindowToggleMaximise,
} from '../../../wailsjs/runtime'

function hasWailsRuntime(): boolean {
    return (
        typeof window !== 'undefined' &&
        typeof (window as unknown as { runtime?: unknown }).runtime !== 'undefined'
    )
}

interface WailsDesktopFlags {
    borderThickness?: unknown
}

function getWailsDesktopFlags(): WailsDesktopFlags | undefined {
    if (typeof window === 'undefined') return undefined
    const flags = (window as unknown as { wails?: { flags?: WailsDesktopFlags } }).wails?.flags
    return flags
}

const WAILS_RESIZE_BORDER_PX = 3

export function shrinkWailsResizeBorder(): void {
    const flags = getWailsDesktopFlags()
    if (!flags || typeof flags.borderThickness !== 'number') return
    flags.borderThickness = WAILS_RESIZE_BORDER_PX
}

export function isWailsWindowAvailable(): boolean {
    return hasWailsRuntime()
}

export function minimizeWindow(): void {
    if (!hasWailsRuntime()) return
    try {
        WindowMinimise()
    } catch {
        // Ignore when running in browser dev mode without Wails runtime.
    }
}

export function toggleMaximizeWindow(): void {
    if (!hasWailsRuntime()) return
    try {
        WindowToggleMaximise()
    } catch {
        // Ignore when running in browser dev mode without Wails runtime.
    }
}

export function closeWindow(): void {
    if (!hasWailsRuntime()) return
    try {
        Quit()
    } catch {
        // Ignore when running in browser dev mode without Wails runtime.
    }
}

export async function isWindowMaximised(): Promise<boolean> {
    if (!hasWailsRuntime()) return false
    try {
        return await WindowIsMaximised()
    } catch {
        return false
    }
}
