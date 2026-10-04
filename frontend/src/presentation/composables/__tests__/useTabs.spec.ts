import { describe, it, expect } from 'vitest'
import { useTabs } from '../useTabs'

describe('useTabs', () => {
    it('starts empty with no active tab', () => {
        const tabs = useTabs<string>()
        expect(tabs.order.value).toEqual([])
        expect(tabs.activeId.value).toBeNull()
    })

    it('uses the first initial tab as active', () => {
        const tabs = useTabs(['a', 'b'])
        expect(tabs.order.value).toEqual(['a', 'b'])
        expect(tabs.activeId.value).toBe('a')
    })

    it('opens a tab and activates it', () => {
        const tabs = useTabs<string>()
        tabs.open('a')
        tabs.open('b')
        expect(tabs.order.value).toEqual(['a', 'b'])
        expect(tabs.activeId.value).toBe('b')
    })

    it('opening an existing tab only re-activates it', () => {
        const tabs = useTabs(['a', 'b'])
        tabs.open('a')
        expect(tabs.order.value).toEqual(['a', 'b'])
        expect(tabs.activeId.value).toBe('a')
    })

    it('isOpen reflects opened tabs', () => {
        const tabs = useTabs<string>()
        tabs.open('a')
        expect(tabs.isOpen('a')).toBe(true)
        expect(tabs.isOpen('b')).toBe(false)
    })

    it('activate switches without reordering', () => {
        const tabs = useTabs(['a', 'b'])
        tabs.activate('b')
        expect(tabs.activeId.value).toBe('b')
        expect(tabs.order.value).toEqual(['a', 'b'])
    })

    it('activate is a no-op for unopened tabs', () => {
        const tabs = useTabs(['a'])
        tabs.activate('b')
        expect(tabs.activeId.value).toBe('a')
    })

    it('closing an inactive tab keeps the active tab', () => {
        const tabs = useTabs(['a', 'b', 'c'])
        tabs.activate('b')
        tabs.close('a')
        expect(tabs.order.value).toEqual(['b', 'c'])
        expect(tabs.activeId.value).toBe('b')
    })

    it('closing the active tab activates the right neighbor', () => {
        const tabs = useTabs(['a', 'b', 'c'])
        tabs.activate('b')
        tabs.close('b')
        expect(tabs.order.value).toEqual(['a', 'c'])
        expect(tabs.activeId.value).toBe('c')
    })

    it('closing the rightmost active tab activates the left neighbor', () => {
        const tabs = useTabs(['a', 'b', 'c'])
        tabs.activate('c')
        tabs.close('c')
        expect(tabs.order.value).toEqual(['a', 'b'])
        expect(tabs.activeId.value).toBe('b')
    })

    it('closing the last tab leaves no active tab', () => {
        const tabs = useTabs(['a'])
        tabs.close('a')
        expect(tabs.order.value).toEqual([])
        expect(tabs.activeId.value).toBeNull()
    })

    it('closing an unknown tab is a no-op', () => {
        const tabs = useTabs(['a'])
        tabs.close('zzz')
        expect(tabs.order.value).toEqual(['a'])
        expect(tabs.activeId.value).toBe('a')
    })

    it('reset clears everything', () => {
        const tabs = useTabs(['a', 'b'])
        tabs.activate('b')
        tabs.reset()
        expect(tabs.order.value).toEqual([])
        expect(tabs.activeId.value).toBeNull()
    })

    it('activeTab computed follows activeId', () => {
        const tabs = useTabs(['a', 'b'])
        tabs.activate('b')
        expect(tabs.activeTab.value).toBe('b')
    })

    it('stores metadata when opening with meta', () => {
        const tabs = useTabs<string, { chatId: string }>()
        tabs.open('a', { chatId: 'chat-a' })
        expect(tabs.getMeta('a')).toEqual({ chatId: 'chat-a' })
    })

    it('activeMeta follows the active tab', () => {
        const tabs = useTabs<string, { kind: string }>()
        tabs.open('a', { kind: 'chat' })
        expect(tabs.activeMeta.value).toEqual({ kind: 'chat' })
        tabs.open('b', { kind: 'settings' })
        expect(tabs.activeMeta.value).toEqual({ kind: 'settings' })
    })

    it('activeMeta is null with no active tab', () => {
        const tabs = useTabs<string, { kind: string }>()
        expect(tabs.activeMeta.value).toBeNull()
    })

    it('opening without meta keeps existing metadata', () => {
        const tabs = useTabs<string, { kind: string }>()
        tabs.open('a', { kind: 'chat' })
        tabs.activate('b')
        tabs.open('a')
        expect(tabs.getMeta('a')).toEqual({ kind: 'chat' })
    })

    it('closing a tab removes its metadata', () => {
        const tabs = useTabs<string, { chatId: string }>()
        tabs.open('a', { chatId: 'chat-a' })
        tabs.close('a')
        expect(tabs.getMeta('a')).toBeUndefined()
        expect(tabs.activeMeta.value).toBeNull()
    })

    it('reset clears all metadata', () => {
        const tabs = useTabs<string, { kind: string }>()
        tabs.open('a', { kind: 'chat' })
        tabs.reset()
        expect(tabs.getMeta('a')).toBeUndefined()
    })
})
