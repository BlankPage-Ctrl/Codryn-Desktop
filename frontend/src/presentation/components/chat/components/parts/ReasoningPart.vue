<script setup lang="ts">
import { computed } from 'vue'
import type { ReasoningPartSchema } from '../../types/schema'
import { BlockPart } from '@/presentation/components/blockpart'
import { createReasoningSchema } from '@/presentation/schemas'

const props = defineProps<{
    schema: ReasoningPartSchema
}>()

const blockSchema = computed(() =>
    createReasoningSchema({
        text: props.schema.text,
        state: props.schema.state,
        ...(props.schema.partId !== undefined ? { partId: props.schema.partId } : {}),
    }),
)
</script>

<template>
    <BlockPart :schema="blockSchema" />
</template>
