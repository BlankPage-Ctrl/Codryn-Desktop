<script setup lang="ts">
import { computed } from 'vue'
import { NavArrowDown } from '@iconoir/vue'
import DropdownRoot from '@/presentation/components/dropdown/DropdownRoot.vue'
import type { Priority } from '@/core/entities'
import {
    createPriorityDropdownItems,
    priorityDropdownProps,
    PRIORITY_TRIGGER_LABELS,
} from '@/presentation/schemas'

const props = defineProps<{
    value: Priority
}>()

const emit = defineEmits<{
    change: [priority: Priority]
}>()

const items = computed(() => createPriorityDropdownItems({ currentPriority: props.value }))

const triggerLabel = computed(() => PRIORITY_TRIGGER_LABELS[props.value])

function handleSelect(val: string) {
    emit('change', val as Priority)
}
</script>

<template>
    <div class="note-priority">
        <DropdownRoot :items="items" v-bind="priorityDropdownProps" @select="handleSelect">
            <template #trigger="{ isOpen, toggle }">
                <button
                    type="button"
                    class="note-priority__trigger"
                    :class="{ 'note-priority__trigger--open': isOpen }"
                    @click="toggle"
                    aria-haspopup="listbox"
                    :aria-expanded="isOpen"
                >
                    <span class="note-priority__trigger-label">Priority: {{ triggerLabel }}</span>
                    <NavArrowDown
                        width="12"
                        height="12"
                        class="note-priority__trigger-chevron"
                        :class="{ 'note-priority__trigger-chevron--open': isOpen }"
                    />
                </button>
            </template>
        </DropdownRoot>
    </div>
</template>

<style scoped>
.note-priority {
    display: flex;
    align-items: center;
    gap: 10px;
}

.note-priority__trigger {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    width: 140px;
    padding: 4px 8px;
    font-size: var(--type-xs);
    font-family: inherit;
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    transition:
        background 80ms ease,
        box-shadow 80ms ease;
}

.note-priority__trigger:hover {
    box-shadow: inset 0 0 0 1px rgba(var(--raw-border-color), 0.4);
}

.note-priority__trigger--open {
    background: rgba(var(--raw-border-color), 0.15);
}

.note-priority__trigger-label {
    flex: 1;
    min-width: 0;
    text-align: left;
    line-height: 1;
}

.note-priority__trigger-chevron {
    color: var(--text-primary);
    opacity: 0.6;
    transition: transform 120ms ease;
    flex-shrink: 0;
}

.note-priority__trigger-chevron--open {
    transform: rotate(180deg);
}
</style>
