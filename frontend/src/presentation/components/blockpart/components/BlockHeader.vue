<script setup lang="ts">
import { computed } from 'vue'
import { Eye, Code } from '@iconoir/vue'
import type { Component } from 'vue'
import type { BlockPartViewMode, BlockPartStatus, BlockPartAction } from '../types/schema'
import BlockActionButton from './BlockActionButton.vue'

const props = defineProps<{
    title?: string
    icon?: Component | string
    collapsible: boolean
    expanded: boolean
    viewToggle: boolean
    viewMode: BlockPartViewMode
    status: BlockPartStatus
    hasPreview: boolean
    hasSource: boolean
    actions?: BlockPartAction[]
}>()

const emit = defineEmits<{
    toggleExpand: []
    toggleView: [mode: BlockPartViewMode]
}>()

const isComponent = computed(() => typeof props.icon === 'object' && props.icon !== null)
const iconLabel = computed(() => {
    if (!props.icon) return ''
    return typeof props.icon === 'string' ? props.icon : ''
})

function handleViewToggle(mode: BlockPartViewMode) {
    emit('toggleView', mode)
}

function handleHeaderClick() {
    if (props.collapsible) emit('toggleExpand')
}

function handleHeaderKeydown(e: KeyboardEvent) {
    if (!props.collapsible) return
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        emit('toggleExpand')
    }
}
</script>

<template>
    <div
        class="block-header"
        :class="{
            'block-header--streaming': status === 'streaming',
            'block-header--collapsible': collapsible,
        }"
        :role="collapsible ? 'button' : undefined"
        :tabindex="collapsible ? 0 : undefined"
        :aria-expanded="collapsible ? expanded : undefined"
        :aria-label="collapsible ? (expanded ? 'Collapse' : 'Expand') : undefined"
        @click="handleHeaderClick"
        @keydown="handleHeaderKeydown"
    >
        <div class="block-header__left">
            <span v-if="icon && isComponent" class="block-icon">
                <component :is="icon" width="14.8" height="14.8" />
            </span>
            <span v-else-if="iconLabel" class="block-icon-label">{{ iconLabel }}</span>
            <span v-if="title" class="block-title">{{ title }}</span>
        </div>
        <div
            v-if="(actions && actions.length) || (viewToggle && (hasPreview || hasSource))"
            class="block-header__right"
        >
            <div v-if="actions && actions.length" class="block-header__actions">
                <BlockActionButton
                    v-for="action in actions"
                    :key="action.id ?? action.ariaLabel"
                    :action="action"
                />
            </div>
            <div v-if="viewToggle && (hasPreview || hasSource)" class="block-header__view-toggle">
                <button
                    class="view-toggle-btn"
                    :class="{ active: viewMode === 'preview' }"
                    :disabled="!hasPreview"
                    @click.stop="handleViewToggle('preview')"
                    type="button"
                >
                    <Eye width="12" height="12" />
                    <span>Preview</span>
                </button>
                <button
                    class="view-toggle-btn"
                    :class="{ active: viewMode === 'source' }"
                    :disabled="!hasSource"
                    @click.stop="handleViewToggle('source')"
                    type="button"
                >
                    <Code width="12" height="12" />
                    <span>Source</span>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.block-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 10px;
    background: var(--bp-header-bg);
    min-height: 32px;
    position: relative;
    overflow: hidden;
}

.block-header--streaming {
    background: var(--bp-header-bg-streaming);
    border-bottom: 1px solid var(--bp-header-border-streaming);
    transition:
        background 0.3s ease,
        border-color 0.3s ease;
}

.block-header--streaming::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1.5px;
    background: linear-gradient(
        90deg,
        transparent 0%,
        transparent 25%,
        var(--bp-stream-accent) 50%,
        transparent 75%,
        transparent 100%
    );
    background-size: 200% 100%;
    animation: header-sweep 1.4s linear infinite;
    opacity: 0.9;
    pointer-events: none;
    transition: opacity 0.35s ease;
}

@keyframes header-sweep {
    0% {
        background-position: 130% 0;
    }
    100% {
        background-position: -30% 0;
    }
}

.block-header__left {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
}

.block-header__actions {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
}

.block-header__right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.block-header__view-toggle {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
}

.block-header--collapsible {
    cursor: pointer;
}

.block-header--collapsible:focus-visible {
    outline: 2px solid var(--bp-focus-ring);
    outline-offset: -2px;
}

.block-icon {
    display: flex;
    align-items: center;
    opacity: 0.6;
    flex-shrink: 0;
}

.block-icon-label {
    font-size: 12px;
    opacity: 0.6;
    flex-shrink: 0;
}

.block-title {
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    color: var(--bp-header-fg);
    opacity: 0.85;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.view-toggle-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border: none;
    background: transparent;
    color: var(--bp-header-fg);
    opacity: 0.45;
    font-size: 11px;
    cursor: pointer;
    border-radius: 3px;
    transition: opacity 0.15s;
}

.view-toggle-btn:hover:not(:disabled) {
    opacity: 0.7;
    background: var(--bp-view-toggle-hover-bg);
}

.view-toggle-btn.active {
    opacity: 0.9;
    background: var(--bp-view-toggle-active-bg);
}

.view-toggle-btn:disabled {
    opacity: 0.2;
    cursor: default;
}

.status-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
}

.status-indicator--streaming {
    background: var(--bp-status-streaming);
    animation: pulse 1.5s ease-in-out infinite;
}

.status-indicator--done {
    background: var(--bp-status-done);
}

@keyframes pulse {
    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.5;
        transform: scale(0.8);
    }
}

@media (prefers-reduced-motion: reduce) {
    .block-header--streaming::after {
        animation: none;
        opacity: 0.45;
        background: var(--bp-stream-accent);
    }
}
</style>
