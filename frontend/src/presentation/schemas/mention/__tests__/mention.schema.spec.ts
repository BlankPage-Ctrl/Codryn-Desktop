import { describe, it, expect } from 'vitest'
import { createMentionItemsFromSymbols } from '../mention.schema'
import { buildInsertText } from '@/shared/utils/mention.utils'
import type { FEInsightSearchHit } from '@/core/entities'

const hits: FEInsightSearchHit[] = [
    {
        id: 'sym-1',
        name: 'greet',
        qualifiedName: 'main.greet',
        kind: 'function',
        filePath: 'main.go',
        lineRange: { start: 10, end: 14 },
        signature: 'func greet()',
    },
    {
        id: 'sym-2',
        name: 'Config',
        kind: 'interface',
        filePath: 'src/config.ts',
        lineRange: { start: 3, end: 8 },
    },
]

describe('createMentionItemsFromSymbols', () => {
    it('maps hits to symbol mention items', () => {
        const items = createMentionItemsFromSymbols({ hits })
        expect(items).toHaveLength(2)
        expect(items[0]).toMatchObject({
            id: 'symbol:sym-1',
            kind: 'symbol',
            label: 'greet',
            description: 'main.greet - main.go:10-14',
            title: 'main.go:10-14',
            insertText: '#symbol:sym-1',
        })
        expect(items[0]?.meta).toMatchObject({
            id: 'sym-1',
            kind: 'function',
            filePath: 'main.go',
            lineStart: 10,
            lineEnd: 14,
        })
    })

    it('falls back to name when qualifiedName is missing', () => {
        const items = createMentionItemsFromSymbols({ hits })
        expect(items[1]?.label).toBe('Config')
        expect(items[1]?.description).toBe('Config - src/config.ts:3-8')
    })

    it('respects maxResults', () => {
        const items = createMentionItemsFromSymbols({ hits, maxResults: 1 })
        expect(items).toHaveLength(1)
    })

    it('returns empty for no hits', () => {
        expect(createMentionItemsFromSymbols({ hits: [] })).toEqual([])
    })
})

describe('buildInsertText symbol', () => {
    it('builds #symbol: token from id', () => {
        expect(buildInsertText('symbol', 'sym-1')).toBe('#symbol:sym-1')
    })
})
