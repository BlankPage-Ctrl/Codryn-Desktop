<script setup lang="ts">
import { computed } from 'vue'
import type { MessageBubbleSchema } from './types/schema.ts'
import { resolveMessageBubbleSchema } from './resolver/resolveMessageBubbleSchema.ts'
import BaseMessageBubble from './components/MessageBubble.vue'

const props = defineProps<{
    schema: MessageBubbleSchema
    resolveAttachmentUrl?: (attachmentId: string) => Promise<string | null>
}>()

const resolved = computed(() => resolveMessageBubbleSchema(props.schema))
</script>

<template>
    <BaseMessageBubble
        :parts="resolved.parts"
        :content-width="resolved.contentWidth"
        :role="resolved.role"
        :role-label="resolved.roleLabel"
        :avatar-label="resolved.avatarLabel"
        :message-id="resolved.messageId"
        :resolve-attachment-url="resolveAttachmentUrl"
        :on-edit-message="resolved.onEditMessage"
        :copy-text="resolved.copyText"
        :can-copy="resolved.canCopy"
    />
</template>
