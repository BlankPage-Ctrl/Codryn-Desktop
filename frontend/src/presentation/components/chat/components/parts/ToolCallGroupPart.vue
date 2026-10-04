<script setup lang="ts">
import { computed } from 'vue'
import type { ToolCallGroupPartSchema } from '../../types/schema'
import { resolveToolCallGroupPartSchema } from '../../resolver/resolvePartsSchema'
import { BlockPart } from '@/presentation/components/blockpart'
import { createToolCallGroupSchema } from '@/presentation/schemas'
import ToolCallPart from './ToolCallPart.vue'

const props = defineProps<{
    schema: ToolCallGroupPartSchema
}>()

const resolved = computed(() => resolveToolCallGroupPartSchema(props.schema))

const blockSchema = computed(() =>
    createToolCallGroupSchema({
        count: resolved.value.count,
        running: resolved.value.running,
        failed: resolved.value.failed,
        statusText: resolved.value.statusText,
        defaultExpanded: resolved.value.defaultExpanded,
        ...(props.schema.partId !== undefined ? { groupId: props.schema.partId } : {}),
    }),
)
</script>

<template>
    <BlockPart :schema="blockSchema">
        <div class="tool-call-group">
            <ToolCallPart
                v-for="item in schema.items"
                :key="item.partId ?? item.toolCallId"
                :schema="item"
            />
        </div>
    </BlockPart>
</template>

<style scoped>
.tool-call-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px;
}

.tool-call-group :deep(.block-part) {
    margin: 0;
}
</style>
