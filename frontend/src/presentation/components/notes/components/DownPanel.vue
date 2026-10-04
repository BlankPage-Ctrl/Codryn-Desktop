<script setup lang="ts">
import { computed } from 'vue'
import { pButton } from '@/presentation/components/button'
import type { Priority } from '@/core/entities'
import NotePriorityPicker from './NotePriorityPicker.vue'

const props = defineProps<{
    dirty: boolean
    saving: boolean
    savedAt: string | null
    priority: Priority
    detailsValid?: boolean
}>()

const emit = defineEmits<{
    save: []
    'priority-change': [priority: Priority]
}>()

const statusText = computed(() => {
    if (props.saving) return 'Saving...'
    if (props.detailsValid === false) return 'Details are required'
    if (props.dirty) return 'Unsaved changes'
    if (props.savedAt) return 'Saved'
    return ''
})

function handlePriorityChange(priority: Priority) {
    emit('priority-change', priority)
}
</script>

<template>
    <div class="note-save-panel">
        <div class="note-save-panel__left">
            <NotePriorityPicker :value="priority" @change="handlePriorityChange" />
            <span
                class="note-save-panel__status"
                :class="{ 'note-save-panel__status--dirty': dirty }"
            >
                {{ statusText }}
            </span>
        </div>
        <pButton
            :schema="{
                variant: 'solid',
                size: 'sm',
                radius: 'md',
                label: 'Save',
                loading: saving,
                disabled: detailsValid === false,
            }"
            @click="emit('save')"
        />
    </div>
</template>
