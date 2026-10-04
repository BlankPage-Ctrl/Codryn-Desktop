<script setup lang="ts">
import { computed } from 'vue'
import type { MessagePartSchema, WorkLogPartSchema } from '../../types/schema'
import { getMessagePartStableId, resolveWorkLogPartSchema } from '../../resolver/resolvePartsSchema'
import { BlockPart } from '@/presentation/components/blockpart'
import { createWorkLogSchema } from '@/presentation/schemas'
import MessagePartSlot from './MessagePartSlot.vue'

const props = defineProps<{
    schema: WorkLogPartSchema
}>()

const resolved = computed(() => resolveWorkLogPartSchema(props.schema))

const blockSchema = computed(() =>
    createWorkLogSchema({
        stepCount: resolved.value.stepCount,
        toolCount: resolved.value.toolCount,
        statusText: resolved.value.statusText,
        defaultExpanded: resolved.value.defaultExpanded,
        ...(props.schema.partId !== undefined ? { worklogId: props.schema.partId } : {}),
    }),
)

function itemKey(item: MessagePartSchema): string {
    return getMessagePartStableId(item)
}
</script>

<template>
    <BlockPart :schema="blockSchema">
        <div class="work-log-group">
            <template v-for="item in schema.items" :key="itemKey(item)">
                <MessagePartSlot :part="item" />
            </template>
        </div>
    </BlockPart>
</template>

<style scoped>
.work-log-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px;
}

.work-log-group :deep(.block-part) {
    margin: 0;
}
</style>
