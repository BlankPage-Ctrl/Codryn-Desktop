<script setup lang="ts">
import NoteListItem from './components/NoteListItem.vue'
import type { NoteGroupItem } from './types/schema'
import type { Note } from '@/core/entities'

defineProps<{
    groups: NoteGroupItem[]
    activeNoteId?: string
}>()

const emit = defineEmits<{
    select: [note: Note]
    delete: [note: Note]
}>()
</script>

<template>
    <div class="note-groups">
        <div v-if="!groups.length" class="note-groups__empty">No notes yet</div>

        <div v-for="group in groups" :key="group.id" class="note-group">
            <div class="note-group__title">{{ group.name }}</div>
            <NoteListItem
                v-for="note in group.notes"
                :key="note.id"
                :note="note"
                :active="note.id === activeNoteId"
                @select="emit('select', $event)"
                @delete="emit('delete', $event)"
            />
        </div>
    </div>
</template>

<style scoped>
.note-groups {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.note-groups__empty {
    padding: 20px 10px;
    text-align: center;
    font-size: var(--type-sm);
    color: var(--text-primary);
    opacity: 0.45;
}

.note-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.note-group__title {
    padding: 8px 10px 4px;
    font-size: var(--type-2xs);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-primary);
    opacity: 0.4;
}
</style>
