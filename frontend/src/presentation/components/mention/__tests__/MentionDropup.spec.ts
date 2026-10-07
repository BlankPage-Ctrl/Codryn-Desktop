import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MentionDropup from '../MentionDropup.vue'
import type { MentionSchema } from '../types/mention.types'
import type { MentionItem } from '@/core/entities/mention'

function item(id: string, kind: MentionItem['kind'], label: string): MentionItem {
    return { id, kind, label, insertText: `#${kind}:${id}`, meta: {} }
}

function symbolItem(id: string, name: string, kind: string): MentionItem {
    return {
        id: `symbol:${id}`,
        kind: 'symbol',
        label: name,
        insertText: `#symbol:${id}`,
        meta: { id, name, kind, filePath: 'x.ts', lineStart: 1, lineEnd: 2 },
    }
}

function mountDropup(items: MentionItem[]) {
    const schema: MentionSchema = { query: 'x', items, visible: true, activeIndex: 0 }
    return mount(MentionDropup, { props: { schema } })
}

const mixed = [
    item('a.ts', 'file', 'a.ts'),
    item('src', 'folder', 'src'),
    item('symbol:sym-1', 'symbol', 'greet'),
]

describe('MentionDropup dynamic kind filter', () => {
    it('renders one chip per kind present in results', () => {
        const wrapper = mountDropup(mixed)
        const chips = wrapper.findAll('.mention-filter__btn')
        expect(chips.map((c) => c.text())).toEqual(['File', 'Directory', 'Symbol'])
    })

    it('omits chips for kinds absent from results', () => {
        const wrapper = mountDropup([item('a.ts', 'file', 'a.ts')])
        const chips = wrapper.findAll('.mention-filter__btn')
        expect(chips.map((c) => c.text())).toEqual(['File'])
    })

    it('filters the list when a chip is clicked, toggles back on second click', async () => {
        const wrapper = mountDropup(mixed)
        const chips = wrapper.findAll('.mention-filter__btn')
        await chips[2]?.trigger('click')
        expect(wrapper.findAll('.mention-item')).toHaveLength(1)
        expect(wrapper.find('.mention-item__label').text()).toBe('greet')
        await chips[2]?.trigger('click')
        expect(wrapper.findAll('.mention-item')).toHaveLength(3)
    })

    it('resets a stale filter when its kind disappears from results', async () => {
        const wrapper = mountDropup(mixed)
        const chips = wrapper.findAll('.mention-filter__btn')
        await chips[2]?.trigger('click')
        expect(wrapper.findAll('.mention-item')).toHaveLength(1)
        await wrapper.setProps({
            schema: {
                query: 'x',
                items: [item('a.ts', 'file', 'a.ts')],
                visible: true,
                activeIndex: 0,
            },
        })
        expect(wrapper.findAll('.mention-item')).toHaveLength(1)
        expect(wrapper.findAll('.mention-filter__btn').map((c) => c.text())).toEqual(['File'])
    })

    it('renders one chip per symbol sub-kind present in results', () => {
        const wrapper = mountDropup([
            symbolItem('sym-1', 'greet', 'function'),
            symbolItem('sym-2', 'Config', 'class'),
            symbolItem('sym-3', 'render', 'method'),
            symbolItem('sym-4', 'fetchAll', 'async-function'),
        ])
        const chips = wrapper.findAll('.mention-filter__btn')
        expect(chips.map((c) => c.text())).toEqual([
            'Function',
            'Class',
            'Method',
            'Async Function',
        ])
    })

    it('filters the list by symbol sub-kind', async () => {
        const wrapper = mountDropup([
            symbolItem('sym-1', 'greet', 'function'),
            symbolItem('sym-2', 'Config', 'class'),
            item('a.ts', 'file', 'a.ts'),
        ])
        const chips = wrapper.findAll('.mention-filter__btn')
        expect(chips.map((c) => c.text())).toEqual(['Function', 'Class', 'File'])
        await chips[1]?.trigger('click')
        const rows = wrapper.findAll('.mention-item')
        expect(rows).toHaveLength(1)
        expect(rows[0]?.find('.mention-item__label').text()).toBe('Config')
    })

    it('falls back to a Symbol chip when sub-kind is unknown', () => {
        const wrapper = mountDropup([item('sym-9', 'symbol', 'mystery')])
        expect(wrapper.findAll('.mention-filter__btn').map((c) => c.text())).toEqual(['Symbol'])
    })
})
