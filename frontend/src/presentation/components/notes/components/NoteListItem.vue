<script setup lang="ts">
import { computed } from 'vue'
import { pButton } from '@/presentation/components/button'
import { TrashActionIcon } from '@/presentation/schemas/common/icons.schema'
import type { Note } from '@/core/entities'

const props = defineProps<{
    note: Note
    active: boolean
}>()

const emit = defineEmits<{
    select: [note: Note]
    delete: [note: Note]
}>()

const priorityLabel = computed(() => {
    const value = String(props.note.priority ?? '').toUpperCase()
    return value ? `\u2022 ${value}` : ''
})
</script>

<template>
    <div
        class="note-list-item"
        :class="{ 'note-list-item--active': active }"
        role="button"
        tabindex="0"
        :aria-current="active ? 'true' : undefined"
        @click="emit('select', note)"
        @keydown.enter="emit('select', note)"
        @keydown.space.prevent="emit('select', note)"
    >
        <div class="note-list-item__body">
            <span class="note-list-item__name">{{ note.name }}</span>
            <span v-if="note.desc" class="note-list-item__desc">{{ note.desc }}</span>
            <div v-if="priorityLabel" class="note-list-item__meta">
                <span class="note-list-item__priority">{{ priorityLabel }}</span>
            </div>
        </div>

        <div class="note-list-item__actions" @click.stop>
            <pButton
                :schema="{
                    variant: 'ghost',
                    size: 'xs',
                    icon: TrashActionIcon,
                    iconPosition: 'only',
                    ariaLabel: 'Delete',
                    preset: 'danger',
                    overrides: { variant: 'ghost', iconPosition: 'only' },
                }"
                @click="emit('delete', note)"
            />
        </div>
    </div>
</template>

<style scoped>
.note-list-item {
    position: relative;
    display: flex;
    align-items: center;
    padding: 10px 12px;
    margin-bottom: 1px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 100ms ease;
}

.note-list-item:hover {
    background: rgba(var(--raw-border-color), 0.3);
}

.note-list-item--active {
    background: rgba(var(--raw-border-color), 0.3);
}

.note-list-item:focus-visible {
    outline: 1px solid rgba(var(--raw-border-color), 0.6);
    outline-offset: -1px;
}

.note-list-item__body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
}

.note-list-item__name,
.note-list-item__desc {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-primary);
}

.note-list-item__name {
    font-family: var(--font-serif);
    font-size: var(--type-sm);
    font-weight: var(--font-weight-normal);
    opacity: 0.6;
    transition:
        opacity 120ms ease,
        font-weight 120ms ease;
}

.note-list-item:hover .note-list-item__name,
.note-list-item--active .note-list-item__name {
    opacity: 1;
    font-weight: var(--font-weight-medium);
}

.note-list-item__desc {
    font-size: var(--type-xs);
    opacity: 0.55;
}

.note-list-item__meta {
    display: flex;
    align-items: center;
    gap: 6px;
}

.note-list-item__priority {
    font-size: var(--type-2xs);
    opacity: 0.35;
}

.note-list-item__actions {
    position: absolute;
    top: 3px;
    right: 6px;
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity 100ms ease;
}

.note-list-item:hover .note-list-item__actions,
.note-list-item--active .note-list-item__actions {
    opacity: 1;
}
</style>
