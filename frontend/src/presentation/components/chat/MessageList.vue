<script setup lang="ts">
import { computed } from 'vue'
import type { MessageListSchema } from './types/schema.ts'
import { resolveMessageListSchema } from './resolver/resolveMessageListSchema.ts'
import BaseMessageList from './components/MessageList.vue'

const props = defineProps<{
    schema: MessageListSchema
}>()

const resolved = computed(() => resolveMessageListSchema(props.schema))
</script>

<template>
    <BaseMessageList :resolved="resolved" />
</template>
