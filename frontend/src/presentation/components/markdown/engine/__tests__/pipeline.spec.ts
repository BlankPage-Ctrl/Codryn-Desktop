import { describe, expect, it } from 'vitest'
import { createMarkdownPipeline } from '../pipeline'
import { splitStableBlocks } from '../splitter'
import {
    fixEmphasis,
    fixFencedCode,
    fixLinkBracket,
    fixStrong,
    patchStreamingTail,
} from '../tail-fixers'
import { findDeepestLeaf, hasLoadingNode } from '../keys'
import { createAstCache } from '../cache'

describe('splitStableBlocks', () => {
    it('splits paragraphs into stable blocks (whitespace separators included)', () => {
        const blocks = splitStableBlocks('# Title\n\nSome text here')
        expect(blocks.length).toBe(3)
        expect(blocks[0]).toBe('# Title')
        expect(blocks[2]).toBe('Some text here')
    })

    it('returns a single block for unclosed footnotes', () => {
        const blocks = splitStableBlocks('Text with [^1]\n\n[^1]: the note')
        expect(blocks.length).toBe(1)
    })
})

describe('patchStreamingTail', () => {
    it('completes an unclosed fenced code block', () => {
        expect(fixFencedCode('```ts\nconst x = 1')).toBe('```ts\nconst x = 1\n```')
    })

    it('completes an unclosed strong marker', () => {
        expect(fixStrong('Hello **world')).toBe('Hello **world**')
    })

    it('completes an unclosed emphasis marker', () => {
        expect(fixEmphasis('Hello *world')).toBe('Hello *world*')
    })

    it('completes an unclosed link url', () => {
        expect(fixLinkBracket('[Google](https://www.goo')).toBe('[Google](https://www.goo)')
    })

    it('runs all default fixers in order', () => {
        const patched = patchStreamingTail('```ts\nconst x = "**')
        expect(patched).toBe('```ts\nconst x = "**\n```')
    })
})

describe('createAstCache', () => {
    it('returns the cached value for the same key', () => {
        const cache = createAstCache()
        const ast = { type: 'root' as const, children: [] }
        cache.set('block', ast)
        expect(cache.get('block')).toBe(ast)
    })

    it('bounds the number of retained entries by max size', () => {
        const cache = createAstCache(2)
        for (let i = 0; i < 10; i++) {
            cache.set(`k${i}`, { type: 'root' as const, children: [] })
        }

        let retained = 0
        for (let i = 0; i < 10; i++) {
            if (cache.get(`k${i}`)) retained += 1
        }
        expect(retained).toBeLessThanOrEqual(2)
    })
})

describe('createMarkdownPipeline', () => {
    it('returns no blocks for empty text', () => {
        const pipeline = createMarkdownPipeline()
        expect(pipeline.parse('')).toEqual([])
    })

    it('parses static mode as a single block without loading state', () => {
        const pipeline = createMarkdownPipeline({ mode: 'static' })
        const blocks = pipeline.parse('para 1\n\npara 2')
        expect(blocks.length).toBe(1)
        expect(hasLoadingNode(blocks[0]!.ast.children)).toBe(false)
    })

    it('marks the deepest leaf of the streaming tail block as loading', () => {
        const pipeline = createMarkdownPipeline({ mode: 'streaming' })
        const blocks = pipeline.parse('Hello **wo')
        const tail = blocks[blocks.length - 1]!
        const leaf = findDeepestLeaf(tail.ast.children)
        expect(leaf?.loading).toBe(true)
    })

    it('reuses cached ASTs for repeated non-tail blocks', () => {
        const pipeline = createMarkdownPipeline({ mode: 'streaming' })
        const first = pipeline.parse('A\n\nB\n\nC')
        const second = pipeline.parse('A\n\nB\n\nC extra')
        expect(second[0]!.ast).toBe(first[0]!.ast)
        expect(second[1]!.ast).toBe(first[1]!.ast)
    })

    it('switches mode at runtime', () => {
        const pipeline = createMarkdownPipeline({ mode: 'streaming' })
        expect(pipeline.parse('x\n\ny').length).toBeGreaterThan(1)

        pipeline.setMode('static')
        expect(pipeline.parse('x\n\ny').length).toBe(1)
        expect(hasLoadingNode(pipeline.parse('x')[0]!.ast.children)).toBe(false)
    })

    it('keeps patched streaming tail content in the returned block', () => {
        const pipeline = createMarkdownPipeline({ mode: 'streaming' })
        const blocks = pipeline.parse('```ts\nconst x = 1')
        expect(blocks[0]!.content).toBe('```ts\nconst x = 1\n```')
    })
})
