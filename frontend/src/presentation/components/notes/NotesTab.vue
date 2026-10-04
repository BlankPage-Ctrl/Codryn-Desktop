<script setup lang="ts">
import { computed } from 'vue'
import type { NotesTabSchema } from './types/schema'
import { resolveNotesTabSchema } from './resolver/resolveNotesTabSchema'
import BaseNotesTab from './BaseNotesTab.vue'

const props = defineProps<{
    schema: NotesTabSchema
}>()

const resolved = computed(() => resolveNotesTabSchema(props.schema))
</script>

<template>
    <BaseNotesTab :resolved="resolved" />
</template>
