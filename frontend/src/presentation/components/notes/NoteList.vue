<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Folder, Search, Xmark } from '@iconoir/vue'
import NoteFilterMenu from './components/NoteFilterMenu.vue'
import type { Note } from '@/core/entities'
import type { NoteListSchema } from './types/schema'
import { resolveNoteListSchema } from './resolver/resolveNoteListSchema'
import NoteListItem from './components/NoteListItem.vue'

const props = defineProps<{
    schema: NoteListSchema
}>()

const emit = defineEmits<{
    select: [note: Note]
    delete: [note: Note]
    'toggle-search': []
    'close-search': []
    'update:search': [value: string]
    'filter-select': [value: string]
    'open-categories': []
}>()

const resolved = computed(() =>
    resolveNoteListSchema(props.schema, {
        onSearch: (value) => emit('update:search', value),
        onCloseSearch: () => emit('close-search'),
        onFilterSelect: (value) => emit('filter-select', value),
    }),
)

const searchEl = ref<HTMLInputElement | null>(null)

watch(
    () => props.schema.searchOpen,
    async (open) => {
        if (!open) return
        await nextTick()
        searchEl.value?.focus()
    },
)

function onSearchInput(event: Event) {
    resolved.value.onSearch((event.target as HTMLInputElement).value)
}

function onSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === 'Escape') {
        resolved.value.onCloseSearch()
    }
}
</script>

<template>
    <div class="note-list">
        <div class="note-list__header">
            <div v-if="resolved.searchOpen" class="note-list__search">
                <Search width="13" height="13" class="note-list__icon" aria-hidden="true" />
                <input
                    ref="searchEl"
                    :value="resolved.search"
                    type="text"
                    class="note-list__search-input"
                    placeholder="Search notes"
                    aria-label="Search notes"
                    @input="onSearchInput"
                    @keydown="onSearchKeydown"
                />
                <button
                    type="button"
                    class="note-list__btn"
                    title="Close search"
                    aria-label="Close search"
                    @click="resolved.onCloseSearch()"
                >
                    <Xmark width="13" height="13" />
                </button>
            </div>

            <div v-else class="note-list__label">
                <span class="note-list__title">Notes</span>
            </div>

            <div class="note-list__actions">
                <button
                    type="button"
                    class="note-list__btn"
                    :class="{ 'note-list__btn--on': resolved.searchActive }"
                    title="Search notes"
                    aria-label="Search notes"
                    :aria-pressed="resolved.searchOpen"
                    @click="emit('toggle-search')"
                >
                    <Search width="13" height="13" />
                    <span
                        v-if="resolved.searchActive"
                        class="note-list__dot"
                        :class="{ 'note-list__dot--hidden': resolved.searchOpen }"
                        aria-hidden="true"
                    />
                </button>

                <NoteFilterMenu
                    :filter="resolved.filter.state"
                    :active="resolved.filter.active"
                    @select="resolved.onFilterSelect"
                />

                <button
                    type="button"
                    class="note-list__btn"
                    :class="{ 'note-list__btn--on': resolved.categoriesOpen }"
                    title="Manage categories"
                    aria-label="Manage categories"
                    :aria-pressed="resolved.categoriesOpen"
                    @click="emit('open-categories')"
                >
                    <Folder width="13" height="13" />
                </button>
            </div>
        </div>

        <div class="note-list__body">
            <div v-if="!resolved.rows.length" class="note-list__empty">
                {{ resolved.emptyMessage }}
            </div>

            <template v-for="row in resolved.rows" :key="row.key">
                <div v-if="row.kind === 'heading'" class="note-list__heading">
                    <span class="note-list__heading-label">{{ row.label }}</span>
                </div>
                <NoteListItem
                    v-else
                    :note="row.note"
                    :active="row.active"
                    @select="emit('select', $event)"
                    @delete="emit('delete', $event)"
                />
            </template>
        </div>
    </div>
</template>

<style src="./styles/note-list.css"></style>
