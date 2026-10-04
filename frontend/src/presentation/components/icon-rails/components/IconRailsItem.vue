<script setup lang="ts">
import { computed } from 'vue'
import type { IconRailsItem, IconRailsSize } from '../types.js'
type Props = {
    item: IconRailsItem
    size?: IconRailsSize
}

const props = withDefaults(defineProps<Props>(), {
    size: 'md',
})

const itemClass = computed(() =>
    [
        'ir-item',
        `ir-item--${props.size}`,
        props.item.active ? 'ir-item--active' : '',
        props.item.disabled ? 'ir-item--disabled' : '',
    ]
        .filter(Boolean)
        .join(' '),
)

function handleClick() {
    if (props.item.disabled) return
    props.item.onClick?.(props.item)
}
</script>

<template>
    <button
        :class="itemClass"
        :title="item.tooltip ?? item.ariaLabel"
        :aria-label="item.ariaLabel"
        :disabled="item.disabled"
        @click="handleClick"
    >
        <component :is="item.icon" width="20" height="20" />
    </button>
</template>
