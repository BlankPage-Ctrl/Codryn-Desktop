import { describe, it, expect } from 'vitest'
import { flattenTree, filterVisible, findItemById, getSelectableItems } from '../utils'
import type { DropdownItemConfig } from '../types'

const sampleItems: DropdownItemConfig[] = [
    { id: 'a', label: 'A', action: { type: 'command', command: 'x' } },
    { id: 'b', label: 'B', visible: false, action: { type: 'command', command: 'x' } },
    { id: 'sep', type: 'separator' },
    {
        id: 'c',
        label: 'C',
        action: { type: 'submenu' },
        children: [
            { id: 'c1', label: 'C1', action: { type: 'command', command: 'x' } },
            { id: 'c2', label: 'C2', action: { type: 'command', command: 'x' } },
        ],
    },
]

describe('flattenTree', () => {
    it('flattens nested items excluding separators and invisible', () => {
        const flat = flattenTree(sampleItems)
        expect(flat.map((i) => i.id)).toEqual(['a', 'c', 'c1', 'c2'])
    })
})

describe('filterVisible', () => {
    it('removes items with visible === false', () => {
        const visible = filterVisible(sampleItems)
        expect(visible.map((i) => i.id)).toEqual(['a', 'sep', 'c'])
    })
})

describe('findItemById', () => {
    it('finds top-level item', () => {
        expect(findItemById(sampleItems, 'a')?.id).toBe('a')
    })

    it('finds nested item', () => {
        expect(findItemById(sampleItems, 'c1')?.id).toBe('c1')
    })

    it('returns undefined for missing item', () => {
        expect(findItemById(sampleItems, 'zzz')).toBeUndefined()
    })
})

describe('getSelectableItems', () => {
    it('returns only enabled, non-separator, non-submenu items', () => {
        const selectable = getSelectableItems(sampleItems)
        expect(selectable.map((i) => i.id)).toEqual(['a'])
    })
})
