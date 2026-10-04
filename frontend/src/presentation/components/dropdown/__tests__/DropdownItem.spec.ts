import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DropdownItem from '../DropdownItem.vue'
import type { DropdownItemConfig } from '../types'

const baseItem: DropdownItemConfig = {
    id: 'test',
    label: 'Test Item',
    action: { type: 'command', command: 'test' },
}

describe('DropdownItem', () => {
    it('renders label', () => {
        const wrapper = mount(DropdownItem, { props: { item: baseItem } })
        expect(wrapper.text()).toContain('Test Item')
    })

    it('renders shortcut when provided', () => {
        const item = { ...baseItem, shortcut: 'Ctrl+S' }
        const wrapper = mount(DropdownItem, { props: { item } })
        expect(wrapper.text()).toContain('Ctrl+S')
    })

    it('shows danger class when item.danger is true', () => {
        const item = { ...baseItem, danger: true }
        const wrapper = mount(DropdownItem, { props: { item } })
        expect(wrapper.find('.dropdown-item--danger').exists()).toBe(true)
    })

    it('shows disabled class when item.enabled is false', () => {
        const item = { ...baseItem, enabled: false }
        const wrapper = mount(DropdownItem, { props: { item } })
        expect(wrapper.find('.dropdown-item--disabled').exists()).toBe(true)
    })

    it('shows focused class when focused prop is true', () => {
        const wrapper = mount(DropdownItem, { props: { item: baseItem, focused: true } })
        expect(wrapper.find('.dropdown-item--focused').exists()).toBe(true)
    })

    it('shows selected class when selected prop is true', () => {
        const wrapper = mount(DropdownItem, { props: { item: baseItem, selected: true } })
        expect(wrapper.find('.dropdown-item--selected').exists()).toBe(true)
    })

    it('shows submenu arrow when hasSubmenu is true', () => {
        const wrapper = mount(DropdownItem, { props: { item: baseItem, hasSubmenu: true } })
        expect(wrapper.find('.dropdown-item__arrow').exists()).toBe(true)
    })

    it('emits click when clicked and enabled', async () => {
        const wrapper = mount(DropdownItem, { props: { item: baseItem } })
        await wrapper.trigger('click')
        expect(wrapper.emitted('click')).toHaveLength(1)
        expect(wrapper.emitted('click')![0]).toEqual([baseItem])
    })

    it('does not emit click when disabled', async () => {
        const item = { ...baseItem, enabled: false }
        const wrapper = mount(DropdownItem, { props: { item } })
        await wrapper.trigger('click')
        expect(wrapper.emitted('click')).toBeUndefined()
    })

    it('emits mouseenter on hover', async () => {
        const wrapper = mount(DropdownItem, { props: { item: baseItem } })
        await wrapper.trigger('mouseenter')
        expect(wrapper.emitted('mouseenter')).toHaveLength(1)
    })
})
