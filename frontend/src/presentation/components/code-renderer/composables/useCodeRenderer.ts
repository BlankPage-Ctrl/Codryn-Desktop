import { computed, onBeforeUnmount, ref, watch, type ComputedRef } from 'vue'
import type { ThemedToken } from 'shiki'
import type { ResolvedCodeRendererSchema } from '../types/schema'
import { toTokensCached } from '../engine/highlighter'

export interface UseCodeRendererReturn {
    tokens: ComputedRef<ThemedToken[][]>
    isHighlighted: ComputedRef<boolean>
    copy: () => Promise<boolean>
}

function scheduleIdle(task: () => void): () => void {
    if (typeof requestIdleCallback === 'function') {
        const id = requestIdleCallback(task, { timeout: 250 })
        return () => cancelIdleCallback(id)
    }
    const id = setTimeout(task, 0)
    return () => clearTimeout(id)
}

const STREAMING_HIGHLIGHT_LIMIT = 2000

export function useCodeRenderer(
    resolved: ComputedRef<ResolvedCodeRendererSchema>,
): UseCodeRendererReturn {
    const tokensRef = ref<ThemedToken[][]>([])
    const isHighlightedRef = ref(false)

    let requestId = 0
    let cancelIdle: (() => void) | undefined

    const tokens = computed(() => tokensRef.value)
    const isHighlighted = computed(() => isHighlightedRef.value)

    watch(
        () => ({
            code: resolved.value.code,
            lang: resolved.value.lang,
            theme: resolved.value.isDark ? resolved.value.theme.dark : resolved.value.theme.light,
            status: resolved.value.status,
        }),
        ({ code, lang, theme, status }) => {
            if (cancelIdle) {
                cancelIdle()
                cancelIdle = undefined
            }

            if (status === 'idle' || !code) {
                tokensRef.value = []
                isHighlightedRef.value = false
                return
            }

            if (status === 'streaming') {
                isHighlightedRef.value = false
                if (code.length > STREAMING_HIGHLIGHT_LIMIT) {
                    // Invalidate in-flight tokenize work for the shorter
                    // prefix; the full highlight runs once on done.
                    requestId += 1
                    return
                }
                const id = ++requestId
                cancelIdle = scheduleIdle(() => {
                    void toTokensCached(code, lang, theme).then((result) => {
                        if (id === requestId) {
                            tokensRef.value = result.tokens
                            isHighlightedRef.value = true
                        }
                    })
                })
                return
            }

            // done
            const id = ++requestId
            void toTokensCached(code, lang, theme).then((result) => {
                if (id === requestId) {
                    tokensRef.value = result.tokens
                    isHighlightedRef.value = true
                }
            })
        },
        { immediate: true, flush: 'post' },
    )

    onBeforeUnmount(() => {
        cancelIdle?.()
    })

    async function copy(): Promise<boolean> {
        const code = resolved.value.code
        if (!code) return false
        try {
            await navigator.clipboard.writeText(code)
            return true
        } catch {
            return false
        }
    }

    return { tokens, isHighlighted, copy }
}
