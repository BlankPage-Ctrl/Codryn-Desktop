<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { computed } from 'vue'
import type { HeaderSchema } from './types/index.ts'
import HeaderTitle from './components/HeaderTitle.vue'
import HeaderActions from './components/HeaderActions.vue'

const props = defineProps<{
    schema: HeaderSchema
}>()

const variant = computed(() => props.schema.variant ?? 'default')

const widthClass = computed(() => (props.schema.width === 'full' ? 'header--full' : 'header--auto'))
const heightClass = computed(() => `header--h-${props.schema.height ?? 'md'}`)
const paddingClass = computed(() => `header--p-${props.schema.padding ?? 'md'}`)
const borderClass = computed(() => (props.schema.border ? 'header--border' : ''))
</script>

<template>
    <div
        class="header"
        :class="[
            `header--${variant}`,
            widthClass,
            heightClass,
            paddingClass,
            borderClass,
            props.schema.class,
        ]"
    >
        <!-- workspace: title centered -->
        <template v-if="variant === 'workspace'">
            <div class="header__start">
                <slot name="start" />
            </div>
            <HeaderTitle
                :title="props.schema.title"
                :subtitle="props.schema.subtitle"
                class="header__center"
            />
            <div class="header__end">
                <HeaderActions
                    v-if="props.schema.actions?.length"
                    :actions="props.schema.actions"
                />
            </div>
        </template>

        <!-- split: actions on left -->
        <template v-else-if="variant === 'split'">
            <HeaderActions
                v-if="props.schema.actions?.length"
                :actions="props.schema.actions"
                class="header__actions--left"
            />
            <HeaderTitle :title="props.schema.title" :subtitle="props.schema.subtitle" />
        </template>

        <!-- default/sidebar: title left, actions right -->
        <template v-else>
            <HeaderTitle :title="props.schema.title" :subtitle="props.schema.subtitle" />
            <HeaderActions v-if="props.schema.actions?.length" :actions="props.schema.actions" />
        </template>
    </div>
</template>

<style scoped>
.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
}

.header--auto {
    width: auto;
}

.header--full {
    width: 100%;
}

.header--h-sm {
    min-height: 32px;
}

.header--h-md {
    min-height: 40px;
}

.header--h-lg {
    min-height: 48px;
}

.header--p-none {
    padding: 0;
}

.header--p-sm {
    padding: 6px 8px;
}

.header--p-md {
    padding: 10px 12px;
}

.header--p-lg {
    padding: 14px 16px;
}

.header--border {
    border-bottom: 1px solid var(--border-color);
}

/* --- Variant: sidebar --- */
.header--sidebar {
    gap: 8px;
}

.header--sidebar :deep(.header-title) {
    font-size: var(--type-md);
}

/* --- Variant: workspace --- */
.header--workspace {
    position: relative;
}

.header__start,
.header__end {
    display: flex;
    align-items: center;
    flex: 1;
}

.header__end {
    justify-content: flex-end;
}

.header__center {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
}

.header__center :deep(*) {
    pointer-events: auto;
}

/* --- Variant: split --- */
.header--split {
    gap: 8px;
}

.header--split .header__actions--left {
    order: -1;
}
</style>
