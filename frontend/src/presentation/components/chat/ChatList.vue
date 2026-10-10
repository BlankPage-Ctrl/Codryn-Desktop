<script setup lang="ts">
import { pButton } from '@/presentation/components/button'
import ChatListItem from './components/ChatListItem.vue'
import type { Chat } from '@/core/entities'

defineProps<{
    chats: Chat[]
    activeChatId?: string
}>()

const emit = defineEmits<{
    select: [chat: Chat]
    edit: [chat: Chat]
    delete: [chat: Chat]
    create: []
}>()
</script>

<template>
    <div class="chat-list">
        <ChatListItem
            v-for="chat in chats"
            :key="chat.id"
            :chat="chat"
            :active="chat.id === activeChatId"
            @select="emit('select', $event)"
            @edit="emit('edit', $event)"
            @delete="emit('delete', $event)"
        />

        <div v-if="!chats.length" class="chat-list__empty">
            <span class="chat-list__empty-message">No chats yet</span>
            <pButton
                :schema="{ preset: 'ghost', size: 'sm', label: 'Create your first chat' }"
                @click="emit('create')"
            />
        </div>
    </div>
</template>

<style scoped>
.chat-list {
    display: flex;
    flex-direction: column;
}

.chat-list__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 24px 12px;
}

.chat-list__empty-message {
    font-size: var(--type-sm);
    color: var(--text-primary);
    opacity: 0.45;
}
</style>
