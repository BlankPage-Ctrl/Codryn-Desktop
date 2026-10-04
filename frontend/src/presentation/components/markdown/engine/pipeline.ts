import type { ParsedNode, SyntaxTree } from '../types'
import { parseMarkdownAst } from './ast'
import { createAstCache } from './cache'
import { hasLoadingNode, stampLoadingLeaf } from './keys'
import { splitStableBlocks } from './splitter'
import { patchStreamingTail, type TailFixerName } from './tail-fixers'

export type PipelineMode = 'streaming' | 'static'

export interface ParsedBlock {
    key: string
    content: string
    ast: SyntaxTree
}

export interface MarkdownPipelineOptions {
    mode?: PipelineMode
    tailSteps?: TailFixerName[]
}

export interface MarkdownPipeline {
    parse(text: string): ParsedBlock[]
    setMode(mode: PipelineMode): void
    hasLoading(nodes?: ParsedNode[]): boolean
    dispose(): void
}

function normalize(content: string): string {
    return content
        .replace(/\r\n?/g, '\n')
        .replace(/-\s*`([^`]+)`\s*-\s*`/g, '- `$1`\n- `')
        .trimEnd()
}

export function createMarkdownPipeline(options: MarkdownPipelineOptions = {}): MarkdownPipeline {
    const cache = createAstCache()
    let mode: PipelineMode = options.mode ?? 'streaming'

    function parse(text: string): ParsedBlock[] {
        const normalized = normalize(text)
        if (!normalized) return []

        const blocks = mode === 'static' ? [normalized] : splitStableBlocks(normalized)

        return blocks.map((block, index) => {
            const isTail = index === blocks.length - 1
            const content =
                mode === 'streaming' && isTail
                    ? patchStreamingTail(block, options.tailSteps)
                    : block

            let ast = cache.get(content)
            if (!ast) {
                ast = parseMarkdownAst(content)
                cache.set(content, ast)
            }

            const resolvedAst = mode === 'streaming' && isTail ? stampLoadingLeaf(ast) : ast

            return {
                key: `markdown-block-${index}`,
                content,
                ast: resolvedAst,
            }
        })
    }

    function hasLoading(nodes?: ParsedNode[]): boolean {
        return hasLoadingNode(nodes)
    }

    return {
        parse,
        setMode: (next: PipelineMode) => {
            mode = next
        },
        hasLoading,
        dispose: () => cache.clear(),
    }
}
