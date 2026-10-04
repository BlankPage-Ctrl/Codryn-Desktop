import type { RendererRegistry, RenderChunk } from '../types'
import type { ParsedBlock } from './pipeline'
import { makeNodeKey } from './keys'

export function createRenderChunks(
    blocks: ParsedBlock[],
    renderers: RendererRegistry,
): RenderChunk[] {
    return blocks.map((block, blockIndex) => ({
        key: block.key,
        items: block.ast.children.map((node, index) => ({
            key: makeNodeKey(node, index, `markdown-block-${blockIndex}`),
            node,
            renderer: renderers[node.type],
        })),
    }))
}
