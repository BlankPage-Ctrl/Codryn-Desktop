<script setup lang="ts">
import { computed } from 'vue'
import { Xmark } from '@iconoir/vue'
import type { TabItem } from '../types/schema'

defineOptions({ name: 'TabStripItem' })

const props = defineProps<{
    item: TabItem
    active: boolean
    closable?: boolean
    onSelect?: (item: TabItem) => void
    onClose?: (item: TabItem) => void
}>()

const itemClass = computed(() =>
    [
        'tabs-item',
        props.active ? 'tabs-item--active' : '',
        props.item.closable === false ? 'tabs-item--pinned' : '',
    ]
        .filter(Boolean)
        .join(' '),
)
</script>

<template>
    <button
        :class="itemClass"
        role="tab"
        :aria-selected="active"
        :title="item.title"
        @click="onSelect?.(item)"
    >
        <span v-if="item.icon" class="tabs-item__icon">
            <component :is="item.icon" width="13" height="13" />
        </span>
        <span class="tabs-item__title">{{ item.title }}</span>
        <span v-if="item.loading" class="tabs-item__spinner" role="status" aria-label="Loading" />
        <span
            v-if="closable && item.closable !== false"
            class="tabs-item__close"
            role="button"
            :aria-label="`Close ${item.title}`"
            @click.stop="onClose?.(item)"
        >
            <Xmark width="12" height="12" />
        </span>
    </button>
</template>
