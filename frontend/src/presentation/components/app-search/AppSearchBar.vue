<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Search, Xmark } from '@iconoir/vue'
import { useFloating, offset, flip, shift, size, autoUpdate } from '@floating-ui/vue'
import { useShortcut } from '@/presentation/composables/keyboard'
import type { AppSearchItemAny } from './types'
import { useAppSearchStore } from './store/useAppSearchStore'
import AppSearchItem from './components/AppSearchItem.vue'

const emit = defineEmits<{
    (e: 'select', payload: AppSearchItemAny): void
}>()

const store = useAppSearchStore()

const referenceEl = ref<HTMLElement | null>(null)
const floatingEl = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const isOpenComputed = computed(() => store.isOpen.value)

// floating positioning - mirror DropdownRoot (bottom-start, left-aligned, no slide)
const { floatingStyles } = useFloating(referenceEl, floatingEl, {
    placement: 'bottom-start',
    middleware: [
        offset(4),
        flip({ fallbackPlacements: ['bottom-start', 'top-start'] }),
        shift(),
        size({
            apply({ elements }) {
                const refEl = elements.reference as HTMLElement | null
                if (refEl) elements.floating.style.width = `${refEl.offsetWidth}px`
            },
        }),
    ],
    whileElementsMounted: autoUpdate,
    open: isOpenComputed,
})

function handleFocus() {
    store.open()
}

function handleInput(e: Event) {
    const v = (e.target as HTMLInputElement).value
    store.setQuery(v)
}

function clear() {
    store.clear()
    // keep open to show all dummy when cleared
    store.open()
    nextTick(() => inputRef.value?.focus())
}

function handleSelect(item: AppSearchItemAny) {
    emit('select', item)
    store.close()
}

function handleHover(item: AppSearchItemAny) {
    const idx = store.items.value.findIndex((i) => i.id === item.id)
    if (idx >= 0) store.setActive(idx)
}

function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (!store.isOpen.value) store.open()
        store.moveNext()
        scrollActiveIntoView()
    } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        store.movePrev()
        scrollActiveIntoView()
    } else if (e.key === 'Enter') {
        if (!store.isOpen.value) return
        e.preventDefault()
        const item = store.items.value[store.activeIndex.value]
        if (item) handleSelect(item)
    } else if (e.key === 'Escape') {
        if (store.isOpen.value) {
            e.preventDefault()
            e.stopPropagation()
            store.close()
        } else if (store.query.value) {
            store.clear()
        }
    }
}

function scrollActiveIntoView() {
    nextTick(() => {
        const el = floatingEl.value?.querySelector('.as-item--active')
        el?.scrollIntoView({ block: 'nearest' })
    })
}

function onClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement
    if (referenceEl.value?.contains(target)) return
    if (floatingEl.value?.contains(target)) return
    store.close()
}

function focusInput() {
    inputRef.value?.focus()
    store.open()
}

useShortcut({
    key: 'k',
    modifiers: { ctrl: true },
    handler: () => focusInput(),
    description: 'Open command palette',
})

onMounted(() => {
    document.addEventListener('mousedown', onClickOutside)
})
onBeforeUnmount(() => {
    document.removeEventListener('mousedown', onClickOutside)
})

// Keep activeIndex in bounds when items shrink
watch(
    () => store.items.value.length,
    (len) => {
        if (store.activeIndex.value >= len) store.setActive(0)
    },
)
</script>

<template>
    <div class="app-search" @keydown="handleKeydown">
        <div
            ref="referenceEl"
            class="app-search__trigger"
            :class="{ 'app-search__trigger--open': store.isOpen.value }"
        >
            <Search width="14" height="14" class="app-search__icon" />
            <input
                ref="inputRef"
                class="app-search__input"
                :value="store.query.value"
                placeholder="Search or jump to…"
                aria-label="Global search"
                @input="handleInput"
                @focus="handleFocus"
            />
            <span v-if="!store.isOpen.value && !store.query.value" class="app-search__shortcut"
                >⌘ + K</span
            >
            <button
                v-if="store.query.value"
                class="app-search__clear"
                aria-label="Clear search"
                @mousedown.prevent
                @click="clear"
            >
                <Xmark width="12" height="12" />
            </button>
        </div>

        <div
            v-if="store.isOpen.value"
            ref="floatingEl"
            class="app-search__floating"
            :style="floatingStyles"
        >
            <Transition name="as-fade" appear>
                <div v-if="store.isOpen.value" class="app-search__panel">
                    <div class="app-search__list" role="listbox">
                        <template v-if="store.items.value.length > 0">
                            <AppSearchItem
                                v-for="(item, idx) in store.items.value"
                                :key="item.id"
                                :item="item"
                                :active="idx === store.activeIndex.value"
                                @select="handleSelect"
                                @hover="handleHover"
                            />
                        </template>
                        <div v-else class="app-search__empty">
                            No results for “{{ store.query.value }}”
                        </div>
                    </div>
                    <div class="app-search__footer">
                        <span class="app-search__hint"><strong>↑↓</strong> navigate</span>
                        <span class="app-search__hint"><strong>↵</strong> select</span>
                        <span class="app-search__hint"><strong>esc</strong> close</span>
                    </div>
                </div>
            </Transition>
        </div>
    </div>
</template>

<style scoped>
.app-search {
    width: 100%;
    max-width: 480px;
    -webkit-app-region: no-drag;
}
.app-search__trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 25px;
    padding-left: 8px;
    padding-right: 2px;

    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    transition:
        border-color 80ms ease,
        background-color 80ms ease;
}
.app-search__trigger--open {
    border-color: rgba(var(--raw-stream-accent), 0.45);
    background: var(--bg-primary);
}
.app-search__trigger:focus-within {
    border-color: rgba(var(--raw-stream-accent), 0.55);
    box-shadow: 0 0 0 2px rgba(var(--raw-stream-accent), 0.12);
}
.app-search__icon {
    color: var(--text-primary);
    opacity: 0.55;
    flex-shrink: 0;
}
.app-search__input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    font-size: var(--type-sm);
    color: var(--text-primary);
    outline: none;
}
.app-search__input::placeholder {
    color: var(--text-primary);
    opacity: 0.45;
}
.app-search__shortcut {
    font-size: var(--type-2xs);
    font-weight: var(--font-weight-medium);
    padding: 1px 5px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-primary);
    opacity: 0.7;
    white-space: nowrap;
}
.app-search__clear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    color: var(--text-primary);
    opacity: 0.7;
}
.app-search__clear:hover {
    background: rgba(var(--raw-border-color), 0.3);
    opacity: 1;
}
.app-search__floating {
    z-index: 1000;
}
.app-search__panel {
    display: flex;
    flex-direction: column;
    max-height: 360px;
    overflow: hidden;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 0px 0px 6px 6px;
    box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.08),
        0 2px 4px rgba(0, 0, 0, 0.06);
}
.app-search__list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 4px;
}
.app-search__list::-webkit-scrollbar {
    width: 4px;
}
.app-search__list::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
}
.app-search__empty {
    padding: 18px 12px;
    text-align: center;
    font-size: var(--type-sm);
    color: var(--text-primary);
    opacity: 0.6;
}
.app-search__footer {
    flex-shrink: 0;
    display: flex;
    gap: 10px;
    padding: 6px 10px 8px;
    border-top: 1px solid var(--border-color);
    background: var(--bg-secondary);
    position: sticky;
    bottom: 0;
}
.app-search__hint {
    font-size: var(--type-2xs);
    color: var(--text-primary);
    opacity: 0.55;
}
.app-search__hint strong {
    font-weight: var(--font-weight-semibold);
    opacity: 0.9;
}
.as-fade-enter-active {
    transition:
        opacity 120ms ease,
        transform 120ms ease;
}
.as-fade-leave-active {
    transition:
        opacity 80ms ease,
        transform 80ms ease;
}
.as-fade-enter-from {
    opacity: 0;
    transform: translateY(-4px);
}
.as-fade-leave-to {
    opacity: 0;
    transform: translateY(-2px);
}
</style>
