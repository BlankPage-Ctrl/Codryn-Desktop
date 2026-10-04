import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'
import type { SyntaxTree } from '../types'

export function parseMarkdownAst(content: string): SyntaxTree {
    return fromMarkdown(content, {
        extensions: [gfm()],
        mdastExtensions: [gfmFromMarkdown()],
    }) as unknown as SyntaxTree
}
