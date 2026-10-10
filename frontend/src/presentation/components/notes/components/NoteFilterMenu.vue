<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { autoUpdate, flip, offset as offsetMiddleware, shift, useFloating } from '@floating-ui/vue'
import { Check, Filter } from '@iconoir/vue'
import {
    GROUP_BY,
    MODIFIED_BY,
    NOTE_GROUP_OPTIONS,
    NOTE_MODIFIED_OPTIONS,
    NOTE_SORT_OPTIONS,
    RESET_FILTER_VALUE,
    SORT_BY,
} from '@/presentation/schemas/dropdown/note-filter-dropdown.schema'
import { DEFAULT_NOTE_FILTER, type NoteFilterState } from '../resolver/filterNotes'

const props = defineProps<{
    filter: NoteFilterState
    active: boolean
}>()

const emit = defineEmits<{
    select: [value: string]
}>()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const { floatingStyles } = useFloating(triggerRef, panelRef, {
    placement: 'bottom-start',
    middleware: computed(() => [
        offsetMiddleware(6),
        flip({ fallbackPlacements: ['top-start', 'bottom-start'] }),
        shift(),
    ]),
    whileElementsMounted: autoUpdate,
    open: isOpen,
    strategy: 'fixed',
})

const sections = computed(() => [
    { prefix: SORT_BY, label: 'Sort by', options: NOTE_SORT_OPTIONS, current: props.filter.sort },
    {
        prefix: MODIFIED_BY,
        label: 'Modified',
        options: NOTE_MODIFIED_OPTIONS,
        current: props.filter.modified,
    },
    {
        prefix: GROUP_BY,
        label: 'Group by',
        options: NOTE_GROUP_OPTIONS,
        current: props.filter.group,
    },
])

const isDefault = computed(
    () =>
        props.filter.sort === DEFAULT_NOTE_FILTER.sort &&
        props.filter.modified === DEFAULT_NOTE_FILTER.modified &&
        props.filter.group === DEFAULT_NOTE_FILTER.group,
)

function open() {
    isOpen.value = true
}

function close() {
    isOpen.value = false
}

function toggle() {
    if (isOpen.value) close()
    else open()
}

function select(prefix: string, value: string) {
    emit('select', `${prefix}:${value}`)
}

function clear() {
    if (isDefault.value) return
    emit('select', RESET_FILTER_VALUE)
}

function handleDocumentPointerDown(event: MouseEvent) {
    if (!isOpen.value) return
    const target = event.target as Node | null
    if (!target) return
    if (triggerRef.value?.contains(target)) return
    if (panelRef.value?.contains(target)) return
    close()
}

function handleDocumentKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen.value) {
        close()
    }
}

function handleTriggerKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        toggle()
    }
    if (event.key === 'ArrowDown' && !isOpen.value) {
        event.preventDefault()
        open()
    }
    if (event.key === 'Escape' && isOpen.value) {
        event.preventDefault()
        close()
    }
}

onMounted(() => {
    document.addEventListener('mousedown', handleDocumentPointerDown)
    document.addEventListener('keydown', handleDocumentKeydown)
})

onBeforeUnmount(() => {
    document.removeEventListener('mousedown', handleDocumentPointerDown)
    document.removeEventListener('keydown', handleDocumentKeydown)
})
</script>

<template>
    <div class="note-filter">
        <button
            ref="triggerRef"
            type="button"
            class="note-list__btn"
            :class="{ 'note-list__btn--on': isOpen || active }"
            title="Filter and sort notes"
            aria-label="Filter and sort notes"
            aria-haspopup="menu"
            :aria-expanded="isOpen"
            @click="toggle"
            @keydown="handleTriggerKeydown"
        >
            <Filter width="13" height="13" />
            <span
                v-if="active"
                class="note-list__dot"
                :class="{ 'note-list__dot--hidden': isOpen }"
                aria-hidden="true"
            />
        </button>

        <Transition name="note-filter-fade">
            <div
                v-if="isOpen"
                ref="panelRef"
                class="note-filter__panel"
                role="menu"
                aria-label="Filter and sort notes"
                :style="floatingStyles"
                @click.stop
            >
                <div v-for="section in sections" :key="section.prefix" class="note-filter__section">
                    <div class="note-filter__label">{{ section.label }}</div>
                    <button
                        v-for="option in section.options"
                        :key="option.value"
                        type="button"
                        class="note-filter__option"
                        :class="{
                            'note-filter__option--selected': option.value === section.current,
                        }"
                        role="menuitemradio"
                        :aria-checked="option.value === section.current"
                        @click="select(section.prefix, option.value)"
                    >
                        <span class="note-filter__check" aria-hidden="true">
                            <Check v-if="option.value === section.current" width="10" height="10" />
                        </span>
                        <span class="note-filter__text">{{ option.label }}</span>
                    </button>
                </div>

                <div class="note-filter__separator" role="separator" />

                <button
                    type="button"
                    class="note-filter__clear"
                    :disabled="isDefault"
                    @click="clear"
                >
                    Clear filters
                </button>
            </div>
        </Transition>
    </div>
</template>

<style src="../styles/note-filter-menu.css"></style>
