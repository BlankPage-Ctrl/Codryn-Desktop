<script setup lang="ts">
import type { FETreeItem } from '@/core/entities'
import FileIcon from './FileIcon.vue'

defineProps<{
    item: FETreeItem
}>()

const emit = defineEmits<{
    toggle: [path: string]
    select: [path: string]
}>()
</script>

<template>
    <li
        class="fe-item"
        :class="{
            'fe-item--selected': item.isSelected,
            'fe-item--directory': item.node.isDirectory,
        }"
        :style="{ paddingLeft: `${item.depth * 16}px` }"
        role="treeitem"
        :aria-expanded="item.node.isDirectory ? item.isExpanded : undefined"
        :aria-selected="item.isSelected"
        @click="emit('select', item.node.path)"
    >
        <span
            v-if="item.node.isDirectory"
            class="fe-item__chevron"
            :class="{
                'fe-item__chevron--expanded': item.isExpanded,
                'fe-item__chevron--loading': item.isLoading,
            }"
            aria-hidden="true"
            @click.stop="emit('toggle', item.node.path)"
        />
        <span v-else class="fe-item__spacer" aria-hidden="true" />

        <FileIcon
            :path="item.node.path"
            :is-directory="item.node.isDirectory"
            :is-expanded="item.isExpanded"
            :is-symlink="!!item.node.symlink"
        />

        <span class="fe-item__name">{{ item.node.name }}</span>

        <span
            v-if="item.node.symlink"
            class="fe-item__symlink"
            :title="`→ ${item.node.symlink!.target}`"
            >⇒</span
        >
    </li>
</template>

<style scoped>
.fe-item {
    display: flex;
    align-items: center;
    height: 22px;
    font-size: var(--type-md);
    color: var(--text-primary);
    cursor: default;
    user-select: none;
    white-space: nowrap;
    overflow: hidden;
    gap: 0;
    padding-right: 8px;
    transition: background-color 80ms ease;
}

.fe-item:hover {
    background-color: rgba(var(--raw-border-color), 0.3);
}

.fe-item--selected {
    background-color: rgba(var(--raw-border-color), 0.3);
    color: var(--text-primary);
}

.fe-item__chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 22px;
    flex-shrink: 0;
    cursor: pointer;
    color: var(--text-primary);
    opacity: 0.4;
    transition:
        transform 0.12s ease,
        opacity 0.12s ease;
}

.fe-item__chevron::before {
    content: '';
    display: block;
    width: 0;
    height: 0;
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
    border-left: 5px solid currentColor;
    transition: transform 0.12s ease;
}

.fe-item__chevron--expanded::before {
    transform: rotate(90deg);
}

.fe-item__chevron--loading::before {
    border: none;
    width: 10px;
    height: 10px;
    border: 2px solid transparent;
    border-top-color: var(--text-primary);
    border-top-color: var(--text-primary);
    border-radius: 50%;
    animation: fe-spin 0.7s linear infinite;
}

.fe-item__chevron:hover {
    opacity: 0.8;
}

.fe-item__spacer {
    display: inline-block;
    width: 16px;
    height: 22px;
    flex-shrink: 0;
}

.fe-item__name {
    margin-left: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
}

.fe-item__symlink {
    margin-left: 4px;
    font-size: var(--type-2xs);
    opacity: 0.4;
    flex-shrink: 0;
}

@keyframes fe-spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
