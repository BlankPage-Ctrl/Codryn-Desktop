<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue'
import { WarningTriangle, Xmark } from '@iconoir/vue'
import type { ResolvedChatErrorBanner } from '../types/resolved.ts'

const DEFAULT_TTL_MS = 8000

const props = defineProps<{
    resolved: ResolvedChatErrorBanner
}>()

const ttl = computed(() => props.resolved.ttlMs ?? DEFAULT_TTL_MS)

let timer: ReturnType<typeof setTimeout> | null = null
let deadline = 0
let remaining = 0

function clearTimer() {
    if (timer !== null) {
        clearTimeout(timer)
        timer = null
    }
}

function schedule(ms: number) {
    clearTimer()
    if (ms <= 0) return
    deadline = Date.now() + ms
    timer = setTimeout(() => {
        timer = null
        props.resolved.onDismiss?.()
    }, ms)
}

function pause() {
    if (timer === null) return
    remaining = Math.max(0, deadline - Date.now())
    clearTimer()
}

function resume() {
    if (timer !== null || remaining <= 0) return
    const ms = remaining
    remaining = 0
    schedule(ms)
}

function handleDismiss() {
    props.resolved.onDismiss?.()
}

// Re-arm on every new error; v-if keeps the instance mounted while
// an error is present, so a plain onMounted would miss replacements.
watch(
    () => [props.resolved.message, props.resolved.code, ttl.value] as const,
    () => {
        remaining = 0
        schedule(ttl.value)
    },
    { immediate: true },
)

onUnmounted(clearTimer)
</script>

<template>
    <div
        class="chat-error-banner"
        role="alert"
        @mouseenter="pause"
        @mouseleave="resume"
        @focusin="pause"
        @focusout="resume"
    >
        <span class="chat-error-banner__icon">
            <WarningTriangle width="14" height="14" />
        </span>
        <span v-if="resolved.code" class="chat-error-banner__code">{{ resolved.code }}</span>
        <span class="chat-error-banner__text" :title="resolved.message">{{
            resolved.message
        }}</span>
        <button
            class="chat-error-banner__dismiss"
            type="button"
            aria-label="Dismiss error"
            @click="handleDismiss"
        >
            <Xmark width="12" height="12" />
        </button>
    </div>
</template>
