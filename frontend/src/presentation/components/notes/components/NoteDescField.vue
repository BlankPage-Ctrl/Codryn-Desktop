<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
    value: string
}>()

const emit = defineEmits<{
    commit: [desc: string]
}>()

const draft = ref(props.value)

watch(
    () => props.value,
    (v) => {
        if (draft.value !== v) draft.value = v
    },
)

function commit() {
    emit('commit', draft.value)
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
        e.preventDefault()
        ;(e.target as HTMLInputElement).blur()
    }
}
</script>

<template>
    <input
        v-model="draft"
        class="note-desc"
        type="text"
        placeholder="Short description..."
        @blur="commit"
        @keydown="onKeydown"
    />
</template>
