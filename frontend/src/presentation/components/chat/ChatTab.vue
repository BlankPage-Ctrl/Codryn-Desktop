<script setup lang="ts">
import { computed } from 'vue'
import type { ChatTabSchema } from './types/schema.ts'
import { resolveChatTabSchema } from './resolver/resolveChatTabSchema.ts'
import BaseChatTab from './BaseChatTab.vue'

const props = defineProps<{
    schema: ChatTabSchema
}>()

const resolved = computed(() => resolveChatTabSchema(props.schema))
</script>

<template>
    <BaseChatTab :resolved="resolved" />
</template>
