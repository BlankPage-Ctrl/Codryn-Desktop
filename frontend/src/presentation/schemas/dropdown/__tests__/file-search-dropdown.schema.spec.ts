import { describe, it, expect } from 'vitest'
import { createFileSearchDropdownItems } from '../file-search-dropdown.schema'
import type { FEFileNode } from '@/core/entities'

const nodes: FEFileNode[] = [
    {
        id: '1',
        name: 'DropdownMenu.vue',
        path: 'src/components/dropdown/DropdownMenu.vue',
        type: 'file',
        isDirectory: false,
    },
    {
        id: '2',
        name: 'dropdown',
        path: 'src/components/dropdown',
        type: 'directory',
        isDirectory: true,
    },
    {
        id: '3',
        name: 'README.md',
        path: 'README.md',
        type: 'file',
        isDirectory: false,
    },
]

describe('createFileSearchDropdownItems', () => {
    it('returns empty when query is blank', () => {
        expect(createFileSearchDropdownItems({ query: '  ', nodes })).toEqual([])
    })

    it('filters by filename, case-insensitive', () => {
        const items = createFileSearchDropdownItems({ query: 'dropdown', nodes })
        expect(items.map((i) => i.id)).toEqual([
            'src/components/dropdown/DropdownMenu.vue',
            'src/components/dropdown',
        ])
    })

    it('formats label as dir - filename', () => {
        const [item] = createFileSearchDropdownItems({ query: 'readme', nodes })
        expect(item?.label).toBe('README.md')
    })

    it('sets title to absolute path when workspaceRoot is provided', () => {
        const [item] = createFileSearchDropdownItems({
            query: 'dropdownmenu',
            nodes,
            workspaceRoot: '/home/user/app',
        })
        expect(item?.title).toBe('/home/user/app/src/components/dropdown/DropdownMenu.vue')
        expect(item?.value).toBe('src/components/dropdown/DropdownMenu.vue')
    })
})
