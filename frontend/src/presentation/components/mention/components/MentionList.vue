<script setup lang="ts">
import { computed } from 'vue'
import type { MentionItem } from '@/core/entities/mention'
import MentionItemRow from './MentionItem.vue'

const props = defineProps<{
    items: MentionItem[]
    activeIndex: number
    grouped?: boolean
    emptyMessage: string
    loading?: boolean
}>()

const emit = defineEmits<{
    (e: 'select', item: MentionItem): void
}>()

interface Group {
    kind: string
    items: MentionItem[]
}

const groups = computed<Group[]>(() => {
    if (!props.grouped) return [{ kind: 'all', items: props.items }]
    const map = new Map<string, MentionItem[]>()
    for (const it of props.items) {
        const arr = map.get(it.kind) ?? []
        arr.push(it)
        map.set(it.kind, arr)
    }
    return Array.from(map.entries()).map(([kind, items]) => ({ kind, items }))
})

function isActive(globalIdx: number): boolean {
    return globalIdx === props.activeIndex
}

function itemGlobalIndex(localIdx: number, groupIdx: number): number {
    if (!props.grouped) return localIdx
    let offset = 0
    for (let i = 0; i < groupIdx; i++) offset += groups.value[i]?.items.length ?? 0
    return offset + localIdx
}
</script>

<template>
    <div
        class="mention-menu"
        :class="{ 'mention-menu--loading': loading && items.length > 0 }"
        role="listbox"
        :aria-busy="loading ? 'true' : 'false'"
    >
        <template v-if="items.length === 0 && !loading">
            <div class="mention-empty">{{ emptyMessage }}</div>
        </template>
        <template v-else-if="items.length === 0 && loading">
            <div class="mention-skeleton" aria-hidden="true">
                <div v-for="i in 3" :key="i" class="mention-skeleton__row">
                    <span class="mention-skeleton__icon" />
                    <span class="mention-skeleton__line mention-skeleton__line--title" />
                    <span class="mention-skeleton__line mention-skeleton__line--desc" />
                </div>
            </div>
        </template>
        <template v-else>
            <TransitionGroup name="mention-item-list" tag="div" class="mention-menu__list">
                <template v-for="(group, gIdx) in groups" :key="group.kind">
                    <div
                        v-if="grouped && groups.length > 1"
                        :key="`label-${group.kind}`"
                        class="mention-group-label"
                    >
                        {{ group.kind }}
                    </div>
                    <MentionItemRow
                        v-for="(item, idx) in group.items"
                        :key="item.id"
                        :item="item"
                        :active="isActive(itemGlobalIndex(idx, gIdx))"
                        @click="emit('select', item)"
                    />
                </template>
            </TransitionGroup>
            <Transition name="mention-overlay-fade">
                <div v-if="loading" class="mention-menu__overlay" aria-hidden="true" />
            </Transition>
        </template>
    </div>
</template>
