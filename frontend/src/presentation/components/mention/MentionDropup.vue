<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useFloating, offset, flip, shift, size, autoUpdate } from '@floating-ui/vue'
import type { MentionSchema } from './types/mention.types'
import { resolveMentionSchema } from './resolver/resolveMentionSchema'
import MentionList from './components/MentionList.vue'

const props = defineProps<{ schema: MentionSchema }>()
const emit = defineEmits<{
    (e: 'select', item: import('@/core/entities/mention').MentionItem): void
    (e: 'close'): void
    (e: 'navigate', index: number): void
}>()

const resolved = computed(() => resolveMentionSchema(props.schema))

const activeFilter = ref<'all' | 'file' | 'folder'>('all')

const filteredItems = computed(() => {
    const items = resolved.value.items
    if (activeFilter.value === 'all') return items
    return items.filter((it) => it.kind === activeFilter.value)
})

function setFilter(kind: 'file' | 'folder') {
    if (activeFilter.value === kind) activeFilter.value = 'all'
    else activeFilter.value = kind
    if (resolved.value.activeIndex !== 0) emit('navigate', 0)
}

watch(
    () => resolved.value.visible,
    (v) => {
        if (!v) activeFilter.value = 'all'
    },
)

watch(
    () => filteredItems.value.length,
    (len) => {
        if (len === 0) return
        if (resolved.value.activeIndex >= len) emit('navigate', 0)
    },
)

const referenceEl = ref<HTMLElement | null>(null)
const floatingEl = ref<HTMLElement | null>(null)

const { floatingStyles } = useFloating(referenceEl, floatingEl, {
    placement: 'top-start',
    middleware: [
        offset(6),
        flip({ fallbackPlacements: ['bottom-start', 'top-start'] }),
        shift({ padding: 8 }),
        size({
            apply({ rects, elements }) {
                elements.floating.style.width = `${rects.reference.width}px`
            },
        }),
    ],
    whileElementsMounted: autoUpdate,
    open: computed(() => resolved.value.visible),
})

function onSelect(item: import('@/core/entities/mention').MentionItem) {
    emit('select', item)
}

function handleKeydown(e: KeyboardEvent) {
    if (!resolved.value.visible) return
    if (e.key === 'Escape') {
        e.preventDefault()
        emit('close')
        return
    }
    const itemsForNav = filteredItems.value
    if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (itemsForNav.length === 0) return
        const next = (resolved.value.activeIndex + 1) % itemsForNav.length
        emit('navigate', next)
        return
    }
    if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (itemsForNav.length === 0) return
        const prev = (resolved.value.activeIndex - 1 + itemsForNav.length) % itemsForNav.length
        emit('navigate', prev)
        return
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
        if (itemsForNav.length === 0) return
        e.preventDefault()
        const item = itemsForNav[resolved.value.activeIndex] ?? itemsForNav[0]
        if (item) emit('select', item)
    }
}

function onClickOutside(e: MouseEvent) {
    if (!resolved.value.visible) return
    const target = e.target as HTMLElement
    if (floatingEl.value?.contains(target)) return
    if (referenceEl.value?.contains(target)) return
    emit('close')
}

onMounted(() => {
    document.addEventListener('mousedown', onClickOutside)
})
onBeforeUnmount(() => {
    document.removeEventListener('mousedown', onClickOutside)
})

// expose anchor setter for parent
defineExpose({ referenceEl, handleKeydown })
</script>

<template>
    <div class="mention-dropup">
        <div ref="referenceEl" class="mention-dropup__anchor">
            <slot :handle-keydown="handleKeydown" />
        </div>

        <Transition name="mention-fade">
            <div
                v-if="resolved.visible"
                ref="floatingEl"
                class="mention-floating"
                :style="floatingStyles"
            >
                <div class="mention-panel">
                    <div class="mention-filter" role="toolbar" aria-label="Filter by kind">
                        <button
                            class="mention-filter__btn"
                            :class="{ 'mention-filter__btn--active': activeFilter === 'file' }"
                            type="button"
                            @mousedown.prevent
                            @click="setFilter('file')"
                        >
                            File
                        </button>
                        <button
                            class="mention-filter__btn"
                            :class="{ 'mention-filter__btn--active': activeFilter === 'folder' }"
                            type="button"
                            @mousedown.prevent
                            @click="setFilter('folder')"
                        >
                            Directory
                        </button>
                        <Transition name="mention-filter-spinner">
                            <span
                                v-if="resolved.loading"
                                class="mention-filter__spinner"
                                aria-label="Loading"
                                aria-hidden="false"
                            />
                        </Transition>
                    </div>
                    <MentionList
                        :items="filteredItems"
                        :active-index="resolved.activeIndex"
                        :grouped="resolved.grouped"
                        :empty-message="resolved.emptyMessage"
                        :loading="resolved.loading"
                        @select="onSelect"
                    />
                </div>
            </div>
        </Transition>
    </div>
</template>

<style src="./styles/index.css"></style>
