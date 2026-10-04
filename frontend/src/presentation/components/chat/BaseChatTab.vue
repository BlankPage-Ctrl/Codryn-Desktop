<script setup lang="ts">
import type { ResolvedChatTab } from './types/resolved.ts'
import BaseMessageList from './components/MessageList.vue'
import BaseChatInput from './components/ChatInput.vue'
import ChatErrorBanner from './components/ChatErrorBanner.vue'
import { HitlDock } from '@/presentation/components/hitl'

defineProps<{
    resolved: ResolvedChatTab
}>()
</script>

<template>
    <div class="chat-tab-content">
        <!-- <div class="chat-tab-header">
            <h2 class="chat-tab-title">{{ resolved.header.title }}</h2>
        </div> -->
        <BaseMessageList :resolved="resolved.messageList" />
        <HitlDock v-if="resolved.hitl" :schema="resolved.hitl" />
        <div class="chat-input-area">
            <ChatErrorBanner v-if="resolved.errorBanner" :resolved="resolved.errorBanner" />
            <BaseChatInput :resolved="resolved.input" />
        </div>
    </div>
</template>

<style src="./styles/index.css"></style>
