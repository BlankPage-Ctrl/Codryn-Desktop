import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DropdownSeparator from '../DropdownSeparator.vue'

describe('DropdownSeparator', () => {
    it('renders separator role', () => {
        const wrapper = mount(DropdownSeparator)
        expect(wrapper.find('[role="separator"]').exists()).toBe(true)
    })

    it('renders line element', () => {
        const wrapper = mount(DropdownSeparator)
        expect(wrapper.find('.dropdown-separator__line').exists()).toBe(true)
    })
})
