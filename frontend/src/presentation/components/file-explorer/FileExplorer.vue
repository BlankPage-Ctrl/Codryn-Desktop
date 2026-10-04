<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useFileExplorerStorer } from '@/application/stores'
import DropdownRoot from '@/presentation/components/dropdown/DropdownRoot.vue'
import { createFileSearchDropdownItems, fileSearchDropdownProps } from '@/presentation/schemas'
import FileTree from './FileTree.vue'

const SEARCH_DEBOUNCE_MS = 250

const emit = defineEmits<{
    toggle: [path: string]
    select: [path: string | null]
    'search-input': [query: string]
    'search-select': [path: string]
}>()

const store = useFileExplorerStorer()

const query = ref('')

let searchTimer: ReturnType<typeof setTimeout> | null = null

function onQueryInput() {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        emit('search-input', query.value)
    }, SEARCH_DEBOUNCE_MS)
}

onBeforeUnmount(() => {
    if (searchTimer) clearTimeout(searchTimer)
})

const searchItems = computed(() =>
    createFileSearchDropdownItems({
        query: query.value,
        nodes: store.searchResults,
        workspaceRoot: store.workspaceRoot,
    }),
)

function handleSearchSelect(path: string) {
    emit('search-select', path)
}
</script>

<template>
    <div class="fe-root">
        <div class="fe-header">
            <div class="fe-search">
                <DropdownRoot
                    :items="searchItems"
                    v-bind="fileSearchDropdownProps"
                    @select="handleSearchSelect"
                >
                    <template #trigger="{ isOpen, toggle }">
                        <input
                            v-model="query"
                            class="fe-search__input"
                            type="text"
                            placeholder="Search files..."
                            aria-label="Search files"
                            @focus="isOpen || toggle()"
                            @input="(onQueryInput(), isOpen || toggle())"
                            @keydown.esc="isOpen && toggle()"
                        />
                    </template>
                </DropdownRoot>
            </div>
        </div>
        <div class="fe-body" role="tree" aria-label="File Explorer">
            <FileTree @toggle="emit('toggle', $event)" @select="emit('select', $event)" />
        </div>
    </div>
</template>

<style scoped>
.fe-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.fe-header {
    height: 35px;
    display: flex;
    align-items: center;
    padding: 0 8px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--border-color);
}

.fe-search {
    flex: 1;
    min-width: 0;
}

.fe-search :deep(.dropdown-root) {
    display: block;
    width: 100%;
}

.fe-search__input {
    width: 100%;
    box-sizing: border-box;
    height: 24px;
    padding: 0 8px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: var(--type-sm);
    outline: none;
}

.fe-search__input::placeholder {
    color: var(--text-primary);
    opacity: 0.4;
}

.fe-search__input:focus {
    border-color: var(--border-color);
    background: var(--bg-primary);
}

.fe-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
}
</style>
