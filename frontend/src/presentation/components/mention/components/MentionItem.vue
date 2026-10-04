<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import type { MentionItem } from '@/core/entities/mention'

const props = defineProps<{
    item: MentionItem
    active?: boolean
}>()

const emit = defineEmits<{
    (e: 'click', item: MentionItem): void
}>()

const kindLabel = computed(() => (props.item.kind === 'folder' ? 'dir' : 'file'))

const fullText = computed(() => {
    if (props.item.description) return `${props.item.label} - ${props.item.description}`
    return props.item.title ?? props.item.label
})

const tooltipTitle = computed(() => props.item.title ?? fullText.value)

const mainRef = ref<HTMLElement | null>(null)
const showTooltip = ref(false)
const tooltipPos = ref({ x: 0, y: 0 })
let hoverTimer: number | null = null

function isTruncated(el: HTMLElement | null): boolean {
    if (!el) return false
    return el.scrollWidth > el.clientWidth + 1
}

function onEnter() {
    if (hoverTimer) clearTimeout(hoverTimer)
    hoverTimer = window.setTimeout(() => {
        const el = mainRef.value
        if (!el) return
        if (!isTruncated(el)) return
        const rect = el.getBoundingClientRect()
        const x = Math.min(rect.left, window.innerWidth - 390)
        tooltipPos.value = { x: Math.max(8, x), y: rect.bottom + 6 }
        showTooltip.value = true
    }, 600)
}

function onLeave() {
    if (hoverTimer) {
        clearTimeout(hoverTimer)
        hoverTimer = null
    }
    showTooltip.value = false
}

function onMouseMove() {
    if (showTooltip.value) {
        const el = mainRef.value
        if (!el) return
        const rect = el.getBoundingClientRect()
        const x = Math.min(rect.left, window.innerWidth - 390)
        tooltipPos.value = { x: Math.max(8, x), y: rect.bottom + 6 }
    }
}

onBeforeUnmount(() => {
    if (hoverTimer) clearTimeout(hoverTimer)
})
</script>

<template>
    <div
        class="mention-item"
        :class="{ 'mention-item--active': active }"
        role="option"
        :aria-selected="active"
        @click="emit('click', item)"
        @mouseenter="onEnter"
        @mouseleave="onLeave"
        @mousemove="onMouseMove"
    >
        <span v-if="item.icon" class="mention-item__icon">
            <component :is="item.icon" :width="14" :height="14" />
        </span>
        <span ref="mainRef" class="mention-item__main mention-item__main--inline">
            <span class="mention-item__label">{{ item.label }}</span>
            <template v-if="item.description">
                <span class="mention-item__dash"> - </span>
                <span class="mention-item__desc">{{ item.description }}</span>
            </template>
        </span>
        <span class="mention-item__kind">{{ kindLabel }}</span>

        <Teleport to="body">
            <div
                v-if="showTooltip"
                class="mention-tooltip"
                role="tooltip"
                :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
                :title="tooltipTitle"
            >
                {{ fullText }}
            </div>
        </Teleport>
    </div>
</template>
