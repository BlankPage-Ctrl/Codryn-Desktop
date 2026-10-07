import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import AppTitle from '../AppTitle.vue'

vi.mock('../../../../wailsjs/runtime', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../../wailsjs/runtime')>()
    return {
        ...actual,
        Quit: vi.fn<() => void>(),
        WindowIsMaximised: vi.fn<() => Promise<boolean>>(),
        WindowMinimise: vi.fn<() => void>(),
        WindowToggleMaximise: vi.fn<() => void>(),
        EventsOn: vi.fn<(event: string, callback: (...args: unknown[]) => void) => () => void>(
            () => () => {},
        ),
        EventsOff: vi.fn<(...args: string[]) => void>(),
    }
})

import {
    Quit,
    WindowIsMaximised,
    WindowMinimise,
    WindowToggleMaximise,
} from '../../../../wailsjs/runtime'

function mountTitle() {
    ;(window as unknown as { runtime?: unknown }).runtime = {}
    return shallowMount(AppTitle, {
        props: { workspaces: [], selectedWorkspaceId: null },
    })
}

beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(WindowIsMaximised).mockResolvedValue(false)
})

describe('AppTitle window hitbox', () => {
    it('clicking the big hitbox area (not the inner button) triggers minimize', async () => {
        const wrapper = mountTitle()
        const boxes = wrapper.findAll('.window-hitbox')
        expect(boxes).toHaveLength(3)
        await boxes[0]!.trigger('click')
        expect(WindowMinimise).toHaveBeenCalledTimes(1)
    })

    it('clicking the maximize hitbox triggers toggle once', async () => {
        const wrapper = mountTitle()
        await wrapper.findAll('.window-hitbox')[1]!.trigger('click')
        expect(WindowToggleMaximise).toHaveBeenCalledTimes(1)
    })

    it('clicking the inner close button bubbles exactly once (no double fire)', async () => {
        const wrapper = mountTitle()
        await wrapper.find('.window-hitbox--close .window-btn').trigger('click')
        expect(Quit).toHaveBeenCalledTimes(1)
    })
})
