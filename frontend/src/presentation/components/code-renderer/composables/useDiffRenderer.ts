import { computed, onBeforeUnmount, ref, watch, type ComputedRef } from 'vue'
import type { ThemedToken } from 'shiki'
import type { ResolvedCodeRendererSchema } from '../types/schema'
import type { DiffLine } from '../utils/parseDiff'
import { toTokensCached } from '../engine/highlighter'

export interface UseDiffRendererReturn {
    diffTokens: ComputedRef<ThemedToken[][]>
    isDiffHighlighted: ComputedRef<boolean>
}

export function useDiffRenderer(
    resolved: ComputedRef<ResolvedCodeRendererSchema>,
    diffLines: ComputedRef<DiffLine[]>,
): UseDiffRendererReturn {
    const tokensRef = ref<ThemedToken[][]>([])
    const isHighlightedRef = ref(false)

    let requestId = 0
    let cancelled = false

    const diffTokens = computed(() => tokensRef.value)
    const isDiffHighlighted = computed(() => isHighlightedRef.value)

    watch(
        () => ({
            lines: diffLines.value,
            lang: resolved.value.lang,
            theme: resolved.value.isDark ? resolved.value.theme.dark : resolved.value.theme.light,
            status: resolved.value.status,
            variant: resolved.value.variant,
        }),
        ({ lines, lang, theme, status, variant }) => {
            if (variant !== 'diff') {
                tokensRef.value = []
                isHighlightedRef.value = false
                return
            }
            if (status === 'idle' || lines.length === 0) {
                tokensRef.value = []
                isHighlightedRef.value = false
                return
            }

            const id = ++requestId
            cancelled = false

            // Resolve tokens per line that needs highlighting
            const promises = lines.map(async (dl) => {
                if (dl.kind === 'hunk' || dl.kind === 'truncated') return [] as ThemedToken[]
                if (!dl.text) return [] as ThemedToken[]
                // Use source language for code part; fallback to plaintext for empty
                try {
                    const result = await toTokensCached(dl.text, lang, theme)
                    // shiki returns tokens grouped by lines; for single line, take first line
                    return result.tokens[0] ?? []
                } catch {
                    return [] as ThemedToken[]
                }
            })

            void Promise.all(promises).then((all) => {
                if (id !== requestId || cancelled) return
                tokensRef.value = all
                isHighlightedRef.value = true
            })
        },
        { immediate: true, flush: 'post' },
    )

    onBeforeUnmount(() => {
        cancelled = true
        requestId++
    })

    return { diffTokens, isDiffHighlighted }
}
