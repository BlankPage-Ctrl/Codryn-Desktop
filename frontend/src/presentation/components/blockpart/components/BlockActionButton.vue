<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import type { BlockPartAction } from '../types/schema'

const props = defineProps<{ action: BlockPartAction }>()

const isComponent = computed(
    () => typeof props.action.icon === 'object' && props.action.icon !== null,
)
const iconLabel = computed(() => {
    if (!props.action.icon) return ''
    return typeof props.action.icon === 'string' ? props.action.icon : ''
})

function handleClick(e: MouseEvent) {
    if (props.action.disabled) {
        e.preventDefault()
        e.stopPropagation()
        return
    }
    e.stopPropagation()
    void props.action.onClick(e)
}

function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        e.stopPropagation()
        if (!props.action.disabled) {
            void props.action.onClick(e as unknown as MouseEvent)
        }
    }
}
</script>

<template>
    <button
        class="block-action-btn"
        type="button"
        :aria-label="action.ariaLabel"
        :title="action.tooltip ?? action.ariaLabel"
        :disabled="action.disabled"
        :aria-disabled="action.disabled ? 'true' : undefined"
        @click="handleClick"
        @keydown="handleKeydown"
    >
        <span v-if="action.icon && isComponent" class="block-action-btn__icon">
            <component :is="action.icon as Component" width="15" height="15" />
        </span>
        <span v-else-if="iconLabel" class="block-action-btn__icon-label">{{ iconLabel }}</span>
    </button>
</template>

<style scoped>
.block-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    border-radius: 3px;
    background: transparent;
    color: var(--bp-action-fg);
    opacity: 0.55;
    cursor: pointer;
    flex-shrink: 0;
    transition:
        opacity 0.15s ease,
        background 0.15s ease,
        transform 0.1s ease;
}

.block-action-btn:hover:not(:disabled) {
    opacity: 0.9;
    background: var(--bp-action-hover-bg);
}

.block-action-btn:active:not(:disabled) {
    transform: scale(0.96);
    background: var(--bp-action-active-bg);
}

.block-action-btn:focus-visible {
    outline: 2px solid var(--bp-focus-ring);
    outline-offset: 1px;
    opacity: 0.9;
}

.block-action-btn:disabled {
    opacity: 0.25;
    cursor: default;
    pointer-events: none;
}

.block-action-btn__icon {
    display: flex;
    align-items: center;
    justify-content: center;
}

.block-action-btn__icon-label {
    font-size: 11px;
    line-height: 1;
}

@media (prefers-reduced-motion: reduce) {
    .block-action-btn {
        transition: opacity 0.1s ease;
    }
    .block-action-btn:active:not(:disabled) {
        transform: none;
    }
}
</style>
