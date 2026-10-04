import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatErrorBanner from '../ChatErrorBanner.vue'
import type { ResolvedChatErrorBanner } from '../../types/resolved'

function mountBanner(resolved: ResolvedChatErrorBanner) {
    return mount(ChatErrorBanner, {
        props: { resolved },
        global: { stubs: { WarningTriangle: true, Xmark: true } },
    })
}

describe('ChatErrorBanner', () => {
    afterEach(() => {
        vi.useRealTimers()
    })
    it('renders the message', () => {
        const wrapper = mountBanner({ message: 'Slow down' })
        expect(wrapper.find('.chat-error-banner__text').text()).toBe('Slow down')
        expect(wrapper.attributes('role')).toBe('alert')
    })

    it('renders the code chip when present', () => {
        const wrapper = mountBanner({ message: 'Slow down', code: 'RATE_LIMITED' })
        expect(wrapper.find('.chat-error-banner__code').text()).toBe('RATE_LIMITED')
    })

    it('omits the code chip when absent', () => {
        const wrapper = mountBanner({ message: 'boom' })
        expect(wrapper.find('.chat-error-banner__code').exists()).toBe(false)
    })

    it('calls onDismiss when the dismiss button is clicked', async () => {
        const onDismiss = vi.fn<() => void>()
        const wrapper = mountBanner({ message: 'boom', onDismiss })
        await wrapper.find('.chat-error-banner__dismiss').trigger('click')
        expect(onDismiss).toHaveBeenCalledOnce()
    })

    it('does not throw without onDismiss', async () => {
        const wrapper = mountBanner({ message: 'boom' })
        await wrapper.find('.chat-error-banner__dismiss').trigger('click')
        expect(wrapper.find('.chat-error-banner').exists()).toBe(true)
    })

    it('auto-dismisses after the default TTL', () => {
        vi.useFakeTimers()
        const onDismiss = vi.fn<() => void>()
        mountBanner({ message: 'boom', onDismiss })
        expect(onDismiss).not.toHaveBeenCalled()
        vi.advanceTimersByTime(7999)
        expect(onDismiss).not.toHaveBeenCalled()
        vi.advanceTimersByTime(1)
        expect(onDismiss).toHaveBeenCalledOnce()
    })

    it('respects a custom ttlMs', () => {
        vi.useFakeTimers()
        const onDismiss = vi.fn<() => void>()
        mountBanner({ message: 'boom', ttlMs: 1000, onDismiss })
        vi.advanceTimersByTime(1000)
        expect(onDismiss).toHaveBeenCalledOnce()
    })

    it('disables TTL when ttlMs is not positive', () => {
        vi.useFakeTimers()
        const onDismiss = vi.fn<() => void>()
        mountBanner({ message: 'boom', ttlMs: 0, onDismiss })
        vi.advanceTimersByTime(60_000)
        expect(onDismiss).not.toHaveBeenCalled()
    })

    it('pauses the TTL while hovered', async () => {
        vi.useFakeTimers()
        const onDismiss = vi.fn<() => void>()
        const wrapper = mountBanner({ message: 'boom', ttlMs: 8000, onDismiss })
        vi.advanceTimersByTime(7000)
        await wrapper.trigger('mouseenter')
        vi.advanceTimersByTime(5000)
        expect(onDismiss).not.toHaveBeenCalled()
        await wrapper.trigger('mouseleave')
        vi.advanceTimersByTime(999)
        expect(onDismiss).not.toHaveBeenCalled()
        vi.advanceTimersByTime(1)
        expect(onDismiss).toHaveBeenCalledOnce()
    })

    it('re-arms the TTL when the message changes', async () => {
        vi.useFakeTimers()
        const onDismiss = vi.fn<() => void>()
        const wrapper = mountBanner({ message: 'first', ttlMs: 8000, onDismiss })
        vi.advanceTimersByTime(7000)
        await wrapper.setProps({ resolved: { message: 'second', ttlMs: 8000, onDismiss } })
        vi.advanceTimersByTime(7000)
        expect(onDismiss).not.toHaveBeenCalled()
        vi.advanceTimersByTime(1000)
        expect(onDismiss).toHaveBeenCalledOnce()
    })
})
