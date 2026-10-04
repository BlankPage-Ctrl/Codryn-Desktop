import { ref, computed } from 'vue'
import type { AppSearchItemAny } from '../types'
import { createCommandPaletteItems } from '@/presentation/schemas/app-search/command-palette.schema'

export function useAppSearchStore() {
    const query = ref('')
    const isOpen = ref(false)
    const activeIndex = ref(0)

    const items = computed<AppSearchItemAny[]>(() =>
        createCommandPaletteItems({ query: query.value }),
    )

    const hasResults = computed(() => items.value.length > 0)

    function open() {
        isOpen.value = true
        activeIndex.value = 0
    }

    function close() {
        isOpen.value = false
        activeIndex.value = 0
    }

    function setQuery(v: string) {
        query.value = v
        activeIndex.value = 0
        if (v.trim().length > 0) {
            if (!isOpen.value) open()
        }
    }

    function moveNext() {
        if (items.value.length === 0) return
        activeIndex.value = (activeIndex.value + 1) % items.value.length
    }

    function movePrev() {
        if (items.value.length === 0) return
        activeIndex.value = (activeIndex.value - 1 + items.value.length) % items.value.length
    }

    function setActive(i: number) {
        activeIndex.value = i
    }

    function clear() {
        query.value = ''
        activeIndex.value = 0
    }

    return {
        query,
        isOpen,
        activeIndex,
        items,
        hasResults,
        open,
        close,
        setQuery,
        moveNext,
        movePrev,
        setActive,
        clear,
    }
}
