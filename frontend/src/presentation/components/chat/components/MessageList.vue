<script setup lang="ts">
import { onUnmounted, ref, watch, nextTick } from 'vue'
import { ChatBubbleEmpty } from '@iconoir/vue'
import type { ResolvedMessageList } from '../types/resolved.ts'
import BaseMessageBubble from './MessageBubble.vue'
import {
    createPartSlotObserver,
    providePartSlotObserver,
} from '../../../composables/usePartSlotObserver.ts'

const props = defineProps<{
    resolved: ResolvedMessageList
}>()

const listRef = ref<HTMLElement | null>(null)
const autoScroll = ref(true)

const observer = createPartSlotObserver(() => listRef.value)
providePartSlotObserver(observer)

onUnmounted(() => {
    observer.disconnect()
})

let scrollQueued = false

function scrollToBottom() {
    if (!listRef.value || !autoScroll.value || scrollQueued) return
    // Coalesce the scroll write into one nextTick per frame: the watcher
    // fires on every stream delta, and each scrollTop write forces reflow
    // against the heavy markdown DOM.
    scrollQueued = true
    nextTick(() => {
        scrollQueued = false
        if (listRef.value && autoScroll.value) {
            listRef.value.scrollTop = listRef.value.scrollHeight
        }
    })
}

function onScroll() {
    if (!listRef.value) return
    const el = listRef.value
    const threshold = 60
    autoScroll.value = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
}

watch(() => listRef.value, scrollToBottom)

watch(
    () => {
        const msgs = props.resolved.messages
        const last = msgs[msgs.length - 1]
        if (!last) return 0
        let textLen = 0
        for (const part of last.parts) {
            if (part.type === 'text') textLen += (part.text ?? '').length
        }
        return msgs.length * 1000000 + last.parts.length * 1000 + textLen
    },
    () => scrollToBottom(),
    { flush: 'post' },
)
</script>

<template>
    <div ref="listRef" class="message-list" @scroll="onScroll">
        <div v-if="resolved.messages.length === 0" class="message-list-empty">
            <div class="empty-icon">
                <ChatBubbleEmpty width="32" height="32" style="opacity: 0.3" />
            </div>
            <span class="empty-label">{{ resolved.emptyMessage }}</span>
            <span class="empty-hint">{{ resolved.emptyHint }}</span>
        </div>
        <BaseMessageBubble
            v-for="msg in resolved.messages"
            :key="msg.id"
            v-memo="[msg]"
            :parts="msg.parts"
            :role="msg.role"
            :content-width="resolved.contentWidth"
            :message-id="msg.id"
            :resolve-attachment-url="resolved.resolveAttachmentUrl"
            :on-edit-message="resolved.onEditMessage"
            :copy-text="msg.copyText"
            :can-copy="msg.canCopy"
        />
        <div v-if="resolved.loading" class="message-list-loading">
            <div class="loading-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>
        </div>
    </div>
</template>
