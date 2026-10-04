import { ref, computed } from 'vue'
import { detectMentionTrigger } from '@/shared/utils/mention.utils'
import type { MentionTriggerRange } from '@/core/entities/mention'

export interface UseMentionTriggerOptions {
    debounceMs?: number
}

export function useMentionTrigger(options: UseMentionTriggerOptions = {}) {
    const debounceMs = options.debounceMs ?? 180

    const query = ref('')
    const range = ref<MentionTriggerRange | null>(null)
    const triggerKind = ref<'@' | '#'>('@')

    const visible = computed(() => range.value !== null)

    let timer: ReturnType<typeof setTimeout> | null = null
    let onSearch: ((prefix: string, range: MentionTriggerRange) => void) | null = null

    function setSearchHandler(fn: (prefix: string, range: MentionTriggerRange) => void) {
        onSearch = fn
    }

    function handleInput(text: string, caretPos: number) {
        if (timer) clearTimeout(timer)

        const hit = detectMentionTrigger(text, caretPos)
        if (!hit) {
            query.value = ''
            range.value = null
            return
        }

        triggerKind.value = hit.kind
        range.value = { start: hit.start, end: hit.end, kind: hit.kind, prefix: hit.prefix }
        query.value = hit.prefix

        timer = setTimeout(() => {
            if (onSearch && range.value) {
                onSearch(hit.prefix, range.value)
            }
        }, debounceMs)

        // immediate also for first char to reduce latency when debounce is small
        if (debounceMs <= 0 && onSearch) onSearch(hit.prefix, range.value)
    }

    function reset() {
        if (timer) clearTimeout(timer)
        query.value = ''
        range.value = null
    }

    function dispose() {
        if (timer) clearTimeout(timer)
    }

    return {
        query,
        range,
        triggerKind,
        visible,
        handleInput,
        reset,
        dispose,
        setSearchHandler,
    }
}
