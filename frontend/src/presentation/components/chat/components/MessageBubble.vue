<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { Check, Copy, EditPencil } from '@iconoir/vue'
import type { FilePartSchema, MessagePartSchema } from '../types/schema.ts'
import { getMessagePartStableId } from '../resolver/resolvePartsSchema.ts'
import MessagePartSlot from './parts/MessagePartSlot.vue'
import UserImageGrid from './UserImageGrid.vue'

const props = defineProps<{
    parts: MessagePartSchema[]
    contentWidth?: number
    role?: 'user' | 'assistant'
    roleLabel?: string
    avatarLabel?: string
    messageId?: string
    /** Resolves `attachment://<id>` refs for history thumbnails. Provided by the View. */
    resolveAttachmentUrl?: (attachmentId: string) => Promise<string | null>
    onEditMessage?: (messageId: string) => void
    copyText?: string
    canCopy?: boolean
}>()

const canEdit = computed(() => props.role === 'user' && !!props.messageId && !!props.onEditMessage)

const showActions = computed(() => canEdit.value || props.canCopy === true)

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

onUnmounted(() => {
    if (copiedTimer !== undefined) clearTimeout(copiedTimer)
})

function handleEdit() {
    if (props.messageId && props.onEditMessage) props.onEditMessage(props.messageId)
}

async function copyFallback(text: string): Promise<void> {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    document.execCommand('copy')
    document.body.removeChild(area)
}

async function handleCopy() {
    const text = props.copyText ?? ''
    if (!text) return
    try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text)
        else await copyFallback(text)
    } catch {
        try {
            await copyFallback(text)
        } catch {
            return
        }
    }
    copied.value = true
    if (copiedTimer !== undefined) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
        copied.value = false
        copiedTimer = undefined
    }, 1500)
}

function partKey(part: MessagePartSchema, idx: number): string {
    const stable = getMessagePartStableId(part)
    // Stable id first (sliceId / toolCallId). The idx suffix only guards
    // legacy parts without partId; real stream parts keep the same key
    // across text updates so BlockPart never remounts.
    if ('partId' in part && part.partId) return `${part.type}:${stable}`
    return `${part.type}:${stable}#${idx}`
}

/** Image attachments render as a static thumbnail grid above the bubble. */
const userImages = computed(() => {
    if (props.role !== 'user') return []
    return props.parts.filter(
        (p): p is { type: 'file' } & FilePartSchema =>
            p.type === 'file' && p.mediaType.startsWith('image/'),
    )
})

const restParts = computed(() => {
    if (props.role !== 'user' || userImages.value.length === 0) return props.parts
    const shown: Set<MessagePartSchema> = new Set(userImages.value)
    return props.parts.filter((p) => !shown.has(p))
})
</script>

<template>
    <div class="message-bubble" :class="[`role-${role ?? 'assistant'}`]">
        <UserImageGrid
            v-if="userImages.length > 0"
            :images="userImages"
            :resolve-attachment-url="resolveAttachmentUrl"
        />
        <div class="bubble-content">
            <div
                class="bubble-role-label"
                v-text="roleLabel ?? (role === 'user' ? 'You' : '')"
            ></div>
            <template v-for="(part, idx) in restParts" :key="partKey(part, idx)">
                <MessagePartSlot :part="part" />
            </template>
        </div>
        <div v-if="showActions" class="bubble-actions">
            <button
                v-if="canCopy"
                class="bubble-action-btn"
                :class="{ 'is-copied': copied }"
                type="button"
                :title="copied ? 'Copied!' : 'Copy message'"
                :aria-label="copied ? 'Copied!' : 'Copy message'"
                @click="handleCopy"
            >
                <Check v-if="copied" width="14" height="14" />
                <Copy v-else width="14" height="14" />
            </button>
            <button
                v-if="canEdit"
                class="bubble-action-btn"
                type="button"
                title="Edit and resend from here"
                aria-label="Edit and resend from here"
                @click="handleEdit"
            >
                <EditPencil width="14" height="14" />
            </button>
        </div>
    </div>
</template>
