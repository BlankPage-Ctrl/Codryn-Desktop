<script setup lang="ts">
import { h } from 'vue'
import type { Component } from 'vue'
import type { HeaderAction } from '../types'

defineProps<{
    actions: HeaderAction[]
}>()

function renderIcon(icon: Component) {
    return h(icon, { width: 14, height: 14 })
}
</script>

<template>
    <div class="header-actions">
        <button
            v-for="(action, index) in actions"
            :key="index"
            class="header-action-btn"
            :disabled="action.disabled"
            :aria-label="action.ariaLabel"
            :title="action.ariaLabel"
            @click="action.onClick"
        >
            <component v-if="action.icon" :is="renderIcon(action.icon)" />
            <span v-if="action.label">{{ action.label }}</span>
        </button>
    </div>
</template>

<style scoped>
.header-actions {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
}

.header-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 4px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
    transition: background 100ms ease;
    opacity: 0.35;
}

.header-action-btn:hover {
    background: rgba(var(--raw-border-color), 0.3);
    opacity: 1;
}

.header-action-btn:disabled {
    opacity: 0.2;
    cursor: not-allowed;
}

.header-action-btn:disabled:hover {
    background: transparent;
}
</style>
