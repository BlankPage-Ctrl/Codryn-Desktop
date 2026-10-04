import { computed, onBeforeUnmount, watch, type ComputedRef } from 'vue'
import type { ResolvedMarkdownSchema, RenderChunk } from '../types'
import { createMarkdownPipeline, type ParsedBlock } from '../engine/pipeline'
import { createRenderChunks } from '../engine/model'

export interface MarkdownRenderModel {
    blocks: ComputedRef<ParsedBlock[]>
    chunks: ComputedRef<RenderChunk[]>
    hasLoading: ComputedRef<boolean>
}

export function useMarkdownRender(
    schema: ComputedRef<ResolvedMarkdownSchema>,
): MarkdownRenderModel {
    const pipeline = createMarkdownPipeline({ mode: schema.value.mode })

    watch(
        () => schema.value.mode,
        (mode) => pipeline.setMode(mode),
    )

    const blocks = computed(() => pipeline.parse(schema.value.text))
    const chunks = computed(() => createRenderChunks(blocks.value, schema.value.renderers))
    const hasLoading = computed(() =>
        blocks.value.some((block) => pipeline.hasLoading(block.ast.children)),
    )

    onBeforeUnmount(() => pipeline.dispose())

    return { blocks, chunks, hasLoading }
}
