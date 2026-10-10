<script setup lang="ts">
import { pButton } from '@/presentation/components/button'
import { EditActionIcon, TrashActionIcon } from '@/presentation/schemas/common/icons.schema'
import type { Chat } from '@/core/entities'

defineProps<{
    chat: Chat
    active: boolean
}>()

const emit = defineEmits<{
    select: [chat: Chat]
    edit: [chat: Chat]
    delete: [chat: Chat]
}>()
</script>

<template>
    <div
        class="chat-list-item"
        :class="{ 'chat-list-item--active': active }"
        role="button"
        tabindex="0"
        :aria-current="active ? 'true' : undefined"
        @click="emit('select', chat)"
        @keydown.enter="emit('select', chat)"
        @keydown.space.prevent="emit('select', chat)"
    >
        <span class="chat-list-item__title">{{ chat.title }}</span>

        <div class="chat-list-item__actions" @click.stop>
            <pButton
                :schema="{
                    variant: 'ghost',
                    size: 'xs',
                    icon: EditActionIcon,
                    iconPosition: 'only',
                    ariaLabel: 'Edit',
                }"
                @click="emit('edit', chat)"
            />
            <pButton
                :schema="{
                    variant: 'ghost',
                    size: 'xs',
                    icon: TrashActionIcon,
                    iconPosition: 'only',
                    ariaLabel: 'Delete',
                    preset: 'danger',
                    overrides: { variant: 'ghost', iconPosition: 'only' },
                }"
                @click="emit('delete', chat)"
            />
        </div>
    </div>
</template>

<style scoped>
.chat-list-item {
    position: relative;
    display: flex;
    align-items: center;
    padding: 8px 10px;
    margin-bottom: 1px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 100ms ease;
}

.chat-list-item:hover {
    background: rgba(var(--raw-border-color), 0.3);
}

.chat-list-item--active {
    background: rgba(var(--raw-border-color), 0.3);
}

.chat-list-item:focus-visible {
    outline: 1px solid rgba(var(--raw-border-color), 0.6);
    outline-offset: -1px;
}

.chat-list-item__title {
    flex: 1;
    min-width: 0;
    font-family: var(--font-serif);
    font-size: var(--type-md);
    font-weight: var(--font-weight-normal);
    color: var(--text-primary);
    opacity: 0.6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition:
        opacity 120ms ease,
        font-weight 120ms ease;
}

.chat-list-item:hover .chat-list-item__title,
.chat-list-item--active .chat-list-item__title {
    opacity: 1;
    font-weight: var(--font-weight-medium);
}

.chat-list-item__actions {
    position: absolute;
    top: 3px;
    right: 6px;
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity 100ms ease;
}

.chat-list-item:hover .chat-list-item__actions,
.chat-list-item--active .chat-list-item__actions {
    opacity: 1;
}
</style>
