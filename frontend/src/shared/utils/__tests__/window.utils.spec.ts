import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isWailsWindowAvailable, shrinkWailsResizeBorder } from '../window.utils'

vi.mock('../../../../wailsjs/runtime', () => ({
    Quit: vi.fn<() => void>(),
    WindowIsMaximised: vi.fn<() => Promise<boolean>>(),
    WindowMinimise: vi.fn<() => void>(),
    WindowToggleMaximise: vi.fn<() => void>(),
}))

interface TestWailsFlags {
    borderThickness?: number
}

function setWailsFlags(flags: TestWailsFlags | undefined) {
    const w = window as unknown as { wails?: { flags?: TestWailsFlags }; runtime?: unknown }
    if (flags === undefined) {
        delete w.wails
    } else {
        w.wails = { flags }
    }
}

beforeEach(() => {
    setWailsFlags(undefined)
    delete (window as unknown as { runtime?: unknown }).runtime
})

afterEach(() => {
    setWailsFlags(undefined)
    delete (window as unknown as { runtime?: unknown }).runtime
})

describe('shrinkWailsResizeBorder', () => {
    it('shrinks the Wails frameless resize border so edge button clicks get through', () => {
        setWailsFlags({ borderThickness: 6 })
        shrinkWailsResizeBorder()
        const flags = (window as unknown as { wails: { flags: TestWailsFlags } }).wails.flags
        expect(flags.borderThickness).toBe(3)
    })

    it('does nothing without Wails desktop flags (browser dev mode)', () => {
        expect(() => shrinkWailsResizeBorder()).not.toThrow()
    })

    it('does nothing when borderThickness is missing', () => {
        setWailsFlags({})
        expect(() => shrinkWailsResizeBorder()).not.toThrow()
    })
})

describe('isWailsWindowAvailable', () => {
    it('detects missing runtime in browser dev mode', () => {
        expect(isWailsWindowAvailable()).toBe(false)
    })
})
