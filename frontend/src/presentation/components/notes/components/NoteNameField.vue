<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'

const props = defineProps<{
    value: string
    autofocus?: boolean
}>()

const emit = defineEmits<{
    commit: [name: string]
}>()

const editing = ref(false)
const draft = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

async function startEdit() {
    draft.value = props.value
    editing.value = true
    await nextTick()
    inputEl.value?.focus()
    inputEl.value?.select()
}

onMounted(() => {
    if (props.autofocus) {
        startEdit()
    }
})

function commit() {
    if (!editing.value) return
    editing.value = false
    const v = draft.value.trim()
    if (v) {
        emit('commit', v)
    } else {
        draft.value = props.value
    }
}

function cancel() {
    editing.value = false
    draft.value = props.value
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
        e.preventDefault()
        commit()
    } else if (e.key === 'Escape') {
        e.preventDefault()
        cancel()
    }
}
</script>

<template>
    <div class="note-name" @dblclick="startEdit">
        <input
            v-if="editing"
            ref="inputEl"
            v-model="draft"
            class="note-name__input"
            @blur="commit"
            @keydown="onKeydown"
        />
        <h1 v-else class="note-name__text">{{ value }}</h1>
    </div>
</template>
