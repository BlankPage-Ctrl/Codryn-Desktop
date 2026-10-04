<script setup lang="ts">
import type { AppSearchItemAny } from '../types'

defineProps<{
    item: AppSearchItemAny
    active?: boolean
}>()

const emit = defineEmits<{
    (e: 'select', item: AppSearchItemAny): void
    (e: 'hover', item: AppSearchItemAny): void
}>()
</script>

<template>
    <div
        class="as-item"
        :class="{ 'as-item--active': active }"
        role="option"
        :aria-selected="active"
        @click="emit('select', item)"
        @mouseenter="emit('hover', item)"
    >
        <div class="as-item__icon">
            <component :is="item.icon" v-if="item.icon" class="as-item__icon-svg" />
        </div>

        <div class="as-item__main">
            <div class="as-item__title">{{ item.title }}</div>
            <div v-if="item.desc" class="as-item__desc">{{ item.desc }}</div>
        </div>

        <div class="as-item__flags">
            <span
                v-for="f in item.flags"
                :key="f.label"
                class="as-flag"
                :class="`as-flag--${f.tone ?? 'default'}`"
                >{{ f.label }}</span
            >
        </div>
    </div>
</template>

<style scoped>
.as-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px;
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    transition: background-color 80ms ease;
}
.as-item--active {
    background: rgba(var(--raw-border-color), 0.3);
}
.as-item:hover {
    background: rgba(var(--raw-border-color), 0.22);
}
.as-item__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: var(--text-primary);
    opacity: 0.85;
}
.as-item__icon-svg {
    width: 16px;
    height: 16px;
}
.as-item__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
}
.as-item__title {
    font-size: var(--type-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
}
.as-item__desc {
    font-size: var(--type-xs);
    color: var(--text-primary);
    opacity: 0.6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
}
.as-item__flags {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    margin-left: 8px;
}
.as-flag {
    font-size: var(--type-2xs);
    font-weight: var(--font-weight-medium);
    padding: 2px 5px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-primary);
    white-space: nowrap;
    line-height: 1;
}
.as-flag--muted {
    opacity: 0.7;
    background: transparent;
}
.as-flag--info {
    background: rgba(var(--raw-stream-accent), 0.14);
    border-color: rgba(var(--raw-stream-accent), 0.25);
    color: var(--text-primary);
}
</style>
