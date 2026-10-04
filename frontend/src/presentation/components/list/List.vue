<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed } from 'vue'
import type { ListSchema } from './types.ts'
import ListItem from './ListItem.vue'
import { pButton } from '@/presentation/components/button'

defineOptions({ name: 'AppList' })

type Props = {
    schema: ListSchema<T>
    items: T[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ select: [item: T]; hoverSelect: [value: string] }>()

const rootClass = computed(() =>
    ['dl-root', `dl-root--${props.schema.variant ?? 'sidebar'}`, props.schema.class ?? '']
        .filter(Boolean)
        .join(' '),
)

function getItemKey(item: T, index: number): string | number {
    const id = item.id
    return id != null ? String(id) : index
}

function isActive(item: T): boolean {
    if (!props.schema.activeKey || props.schema.activeId == null) return false
    return item[props.schema.activeKey] === props.schema.activeId
}

function handleSelect(item: T) {
    props.schema.onSelect?.(item)
    emit('select', item)
}

function getHoverItems(item: T) {
    if (!props.schema.hoverMenu) return undefined
    return props.schema.hoverMenu.items(item)
}

function handleHoverSelect(value: string) {
    props.schema.hoverMenu?.onSelect(value)
    emit('hoverSelect', value)
}
</script>

<style src="./styles/list.css"></style>

<template>
    <div :class="rootClass">
        <ListItem
            v-for="(item, index) in items"
            :key="getItemKey(item, index)"
            :item="item"
            :fields="schema.fields"
            :actions="schema.actions"
            :active="isActive(item)"
            :size="schema.size ?? 'sm'"
            :text-size="schema.textSize"
            :variant="schema.variant ?? 'sidebar'"
            :hover-menu-items="getHoverItems(item)"
            :icon="schema.icon"
            :font-family="schema.fontFamily"
            :font-weight="schema.fontWeight"
            :dim="schema.dim"
            :on-select="handleSelect"
            @hover-select="handleHoverSelect"
        />

        <div v-if="!items.length" class="dl-empty">
            <span class="dl-empty__message">{{ schema.emptyMessage ?? 'No items' }}</span>
            <pButton
                v-if="schema.emptyAction"
                :schema="{ preset: 'ghost', size: 'sm', label: schema.emptyAction.label }"
                @click="schema.emptyAction!.onClick()"
            />
        </div>
    </div>
</template>
