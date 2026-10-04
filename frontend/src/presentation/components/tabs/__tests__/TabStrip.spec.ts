import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import TabStrip from '../TabStrip.vue'
import type { TabStripSchema } from '../types/schema'

const icon = () => h('span', { 'data-testid': 'tab-icon' })

const mountTabStrip = (schema: TabStripSchema<string>) =>
    mount(TabStrip, {
        props: { schema },
        global: { stubs: { Xmark: true } },
    })

function makeSchema(overrides: Partial<TabStripSchema<string>> = {}): TabStripSchema<string> {
    return {
        tabs: [
            { id: 'a', title: 'Chat A', icon, closable: true },
            { id: 'b', title: 'Chat B', icon, closable: true },
        ],
        activeId: 'a',
        closable: true,
        onSelect: () => undefined,
        onClose: () => undefined,
        ...overrides,
    }
}

describe('TabStrip', () => {
    it('renders all tabs with titles', () => {
        const wrapper = mountTabStrip(makeSchema())
        const titles = wrapper.findAll('.tabs-item__title').map((n) => n.text())
        expect(titles).toEqual(['Chat A', 'Chat B'])
    })

    it('marks the active tab', () => {
        const wrapper = mountTabStrip(makeSchema())
        const items = wrapper.findAll('.tabs-item')
        expect(items[0]!.classes()).toContain('tabs-item--active')
        expect(items[0]!.attributes('aria-selected')).toBe('true')
        expect(items[1]!.classes()).not.toContain('tabs-item--active')
    })

    it('renders item icons', () => {
        const wrapper = mountTabStrip(makeSchema())
        expect(wrapper.findAll('[data-testid="tab-icon"]')).toHaveLength(2)
    })

    it('calls onSelect when a tab is clicked', async () => {
        const onSelect = vi.fn<(id: string) => void>()
        const wrapper = mountTabStrip(makeSchema({ onSelect }))
        await wrapper.findAll('.tabs-item')[1]!.trigger('click')
        expect(onSelect).toHaveBeenCalledWith('b')
    })

    it('calls onClose when the close button is clicked', async () => {
        const onClose = vi.fn<(id: string) => void>()
        const wrapper = mountTabStrip(makeSchema({ onClose }))
        await wrapper.findAll('.tabs-item__close')[0]!.trigger('click')
        expect(onClose).toHaveBeenCalledWith('a')
    })

    it('hides close buttons when closable is false', () => {
        const wrapper = mountTabStrip(makeSchema({ closable: false }))
        expect(wrapper.findAll('.tabs-item__close')).toHaveLength(0)
    })

    it('hides close button for pinned tabs', () => {
        const wrapper = mountTabStrip({
            tabs: [
                { id: 'a', title: 'Chat A', icon, closable: false },
                { id: 'b', title: 'Chat B', icon },
            ],
            activeId: 'a',
            closable: true,
        })
        const items = wrapper.findAll('.tabs-item')
        expect(items[0]!.find('.tabs-item__close').exists()).toBe(false)
        expect(items[1]!.find('.tabs-item__close').exists()).toBe(true)
    })
})
