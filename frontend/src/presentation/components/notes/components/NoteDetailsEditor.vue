<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
    value: string
}>()

const emit = defineEmits<{
    change: [details: string]
}>()

const draft = ref(props.value)

watch(
    () => props.value,
    (v) => {
        if (draft.value !== v) draft.value = v
    },
)

function onInput() {
    emit('change', draft.value)
}
</script>

<template>
    <textarea
        v-model="draft"
        class="note-details"
        placeholder="Write your note details here..."
        spellcheck="false"
        @input="onInput"
    ></textarea>
</template>
