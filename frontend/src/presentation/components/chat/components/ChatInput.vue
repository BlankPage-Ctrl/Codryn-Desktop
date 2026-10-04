<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue'
import {
    Brain,
    ChatBubbleEmpty,
    Cube,
    EditPencil,
    Map,
    NavArrowDown,
    SendDiagonal,
    WarningTriangle,
    Xmark,
} from '@iconoir/vue'
import DropdownRoot from '@/presentation/components/dropdown/DropdownRoot.vue'
import { MentionDropup } from '@/presentation/components/mention'
import ImageAttacher from './ImageAttacher.vue'
import type { ResolvedChatInput } from '../types/resolved'
import type { DropdownItemConfig, StyleConfig } from '@/presentation/components/dropdown/types'
import type { ChatMode, MentionItem, MentionTriggerRange } from '@/core/entities'
import { detectMentionTrigger, insertMentionAt } from '@/shared/utils/mention.utils'

const props = defineProps<{
    resolved: ResolvedChatInput
}>()

const CHAT_MODES: { value: ChatMode; label: string; icon: typeof ChatBubbleEmpty }[] = [
    { value: 'ask', label: 'Ask', icon: ChatBubbleEmpty },
    { value: 'plan', label: 'Plan', icon: Map },
    { value: 'edit', label: 'Edit', icon: EditPencil },
]

const currentMode = computed<ChatMode>(() => props.resolved.mode ?? 'ask')

function selectMode(mode: ChatMode) {
    if (mode === currentMode.value) return
    props.resolved.onChangeMode?.(mode)
}

const THINKING_LEVELS: { value: string; label: string }[] = [
    { value: 'default', label: 'Default' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'xhigh', label: 'X-High' },
]

const modelDropdownStyle: StyleConfig = {
    menu: {
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '2px',
        shadow: '0 4px 14px rgba(0, 0, 0, 0.14)',
    },
    item: {
        padding: '3px 8px',
        fontSize: 'var(--type-xs)',
        borderRadius: '4px',
        hoverBackground: 'var(--border-color)',
        focusedBackground: 'var(--border-color)',
        selectedBackground: 'var(--border-color)',
    },
}

const input = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const mentionRange = ref<MentionTriggerRange | null>(null)
const mentionActiveIndex = ref(0)
const mentionDropupRef = ref<InstanceType<typeof MentionDropup> | null>(null)

const isEditing = computed(() => props.resolved.editDraft != null)

const attachedImages = computed(() => props.resolved.attachedImages ?? [])

const readyImageCount = computed(
    () => attachedImages.value.filter((img) => img.status === 'ready').length,
)

const hasUploadingImages = computed(() =>
    attachedImages.value.some((img) => img.status === 'uploading'),
)

const hasImageError = computed(() => attachedImages.value.some((img) => img.status === 'error'))

const canAttach = computed(
    () => !isEditing.value && !props.resolved.disabled && !!props.resolved.onPickImages,
)

const canSend = computed(() => {
    if (props.resolved.disabled) return false
    // Block-all: never send while an upload is in flight or failed.
    if (hasUploadingImages.value || hasImageError.value) return false
    return input.value.trim() !== '' || readyImageCount.value > 0
})

const effectivePlaceholder = computed(() => {
    if (isEditing.value) return 'Edit prompt — Send restarts from here…'
    return props.resolved.disabled ? 'AI is responding...' : props.resolved.placeholder
})

watch(
    () => props.resolved.editDraft,
    (draft) => {
        if (draft == null) {
            input.value = ''
            mentionRange.value = null
            return
        }
        if (draft !== input.value) {
            input.value = draft
            nextTick(() => textareaRef.value?.focus())
        }
    },
    { immediate: true },
)

function handleCancelEdit() {
    props.resolved.onCancelEdit?.()
}

const revertPreview = computed(() => props.resolved.revertPreview ?? null)

/** Files the revert would touch (preview ready only). */
const revertFiles = computed(() => revertPreview.value?.preview?.files ?? [])

const revertOkCount = computed(() => revertFiles.value.filter((f) => f.status === 'ok').length)

const revertConflictCount = computed(
    () => revertFiles.value.filter((f) => f.status === 'conflict').length,
)

/** Suffix messages the send would delete (preview ready only). */
const revertSuffixCount = computed(() => revertPreview.value?.preview?.suffixIds.length ?? 0)

const showRestoreToggle = computed(
    () =>
        isEditing.value &&
        revertPreview.value?.status === 'ready' &&
        revertFiles.value.length > 0 &&
        props.resolved.onToggleRestoreFiles != null,
)

const restoreEnabled = computed(() => revertPreview.value?.restoreFiles ?? true)

const revertBannerTitle = computed(() => {
    const parts: string[] = []
    if (revertSuffixCount.value > 0) parts.push(`deletes ${revertSuffixCount.value} messages`)
    if (revertOkCount.value > 0)
        parts.push(`restores ${revertOkCount.value} file${revertOkCount.value === 1 ? '' : 's'}`)
    if (revertConflictCount.value > 0)
        parts.push(
            `${revertConflictCount.value} conflict${revertConflictCount.value === 1 ? '' : 's'} (changed since, will be skipped)`,
        )
    return parts.length > 0 ? `Send ${parts.join(', ')}.` : null
})

function handleToggleRestoreFiles(e: Event) {
    const target = e.target as HTMLInputElement
    props.resolved.onToggleRestoreFiles?.(target.checked)
}

const mentionVisible = computed(() => {
    if (!mentionRange.value) return false
    return true
})

const mentionSchema = computed(() => ({
    query: mentionRange.value?.prefix ?? '',
    items: props.resolved.mentionItems ?? [],
    visible: mentionVisible.value,
    activeIndex: mentionActiveIndex.value,
    loading: props.resolved.mentionLoading ?? false,
    grouped: false,
    emptyMessage: 'No files found',
}))

let searchDebounce: ReturnType<typeof setTimeout> | null = null

function triggerMentionSearch(query: string, range: MentionTriggerRange) {
    if (searchDebounce) clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => {
        props.resolved.onMentionSearch?.(query, range)
    }, 180)
}

function updateMentionState(text: string, caretPos: number) {
    const hit = detectMentionTrigger(text, caretPos)
    if (!hit) {
        mentionRange.value = null
        mentionActiveIndex.value = 0
        return
    }
    mentionRange.value = hit
    mentionActiveIndex.value = 0
    triggerMentionSearch(hit.prefix, hit)
}

function onInputWithMention(e: Event) {
    const target = e.target as HTMLTextAreaElement
    const caret = target.selectionStart ?? input.value.length
    updateMentionState(input.value, caret)
}

function onKeyupWithMention(e: KeyboardEvent) {
    const target = e.target as HTMLTextAreaElement
    const caret = target.selectionStart ?? input.value.length
    // Arrow keys should not reset mention unless trigger gone
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
        updateMentionState(input.value, caret)
    }
}

function onClickWithMention(e: MouseEvent) {
    const target = e.target as HTMLTextAreaElement
    const caret = target.selectionStart ?? input.value.length
    updateMentionState(input.value, caret)
}

function handleMentionSelect(item: MentionItem) {
    if (!mentionRange.value) return
    const result = insertMentionAt(input.value, mentionRange.value, item.insertText)
    input.value = result.text
    mentionRange.value = null
    mentionActiveIndex.value = 0
    nextTick(() => {
        if (textareaRef.value) {
            textareaRef.value.focus()
            textareaRef.value.selectionStart = result.caretPos
            textareaRef.value.selectionEnd = result.caretPos
        }
    })
}

function handleMentionClose() {
    mentionRange.value = null
    mentionActiveIndex.value = 0
}

function handleMentionNavigate(idx: number) {
    mentionActiveIndex.value = idx
}

watch(
    () => props.resolved.mentionItems,
    () => {
        // keep active index in bounds
        const len = props.resolved.mentionItems?.length ?? 0
        if (mentionActiveIndex.value >= len && len > 0) mentionActiveIndex.value = 0
    },
)

const thinkingEnabled = computed(
    () =>
        !!props.resolved.thinkingMode &&
        props.resolved.thinkingMode !== 'none' &&
        !!props.resolved.onChangeThinkingMode,
)

const currentLevel = computed(() =>
    thinkingEnabled.value ? (props.resolved.thinkingMode ?? 'default') : 'default',
)

const levelItems = computed<DropdownItemConfig<string>[]>(() =>
    THINKING_LEVELS.map(({ value, label }) => ({
        id: `lvl-${value}`,
        label,
        value,
        selected: value === currentLevel.value,
    })),
)

function toggleThinking() {
    if (props.resolved.onChangeThinkingMode) {
        props.resolved.onChangeThinkingMode(thinkingEnabled.value ? 'none' : 'default')
    }
}

function onLevelSelect(value: string) {
    props.resolved.onChangeThinkingMode?.(value)
}

function onKeydown(e: KeyboardEvent) {
    // Mention navigation takes precedence when visible
    if (mentionVisible.value) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Escape') {
            mentionDropupRef.value?.handleKeydown(e)
            if (e.defaultPrevented) return
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
            if ((props.resolved.mentionItems?.length ?? 0) > 0) {
                e.preventDefault()
                const item = props.resolved.mentionItems![mentionActiveIndex.value]
                if (item) handleMentionSelect(item)
                return
            }
        }
        if (e.key === 'Escape') {
            e.preventDefault()
            handleMentionClose()
            return
        }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
    }
}

function handleSend() {
    if (!canSend.value) return
    props.resolved.onSend?.(input.value.trim())
    if (props.resolved.editDraft == null) {
        input.value = ''
        mentionRange.value = null
    }
    // In edit mode the input is cleared by the editDraft watcher once the
    // draft is dismissed (success). On failure the draft stays, so the text
    // must be preserved here for retry.
}

function handleStop() {
    props.resolved.onStop?.()
}

function onModelSelect(value: string) {
    if (!props.resolved.onSelectModel) return
    const item = props.resolved.modelItems.find((i) => i.value === value)
    const providerId = item?.providerId ?? props.resolved.providerId
    if (providerId) {
        props.resolved.onSelectModel(value, providerId)
    }
}
</script>

<template>
    <div class="chat-input">
        <MentionDropup
            ref="mentionDropupRef"
            :schema="mentionSchema"
            @select="handleMentionSelect"
            @close="handleMentionClose"
            @navigate="handleMentionNavigate"
        >
            <template #default>
                <div v-if="isEditing" class="edit-banner">
                    <span class="edit-banner__text"
                        >Editing earlier prompt — Send stops the current run and restarts from
                        here.</span
                    >
                    <button
                        class="edit-banner__cancel"
                        type="button"
                        title="Cancel edit"
                        @click="handleCancelEdit"
                    >
                        <Xmark width="12" height="12" />
                        <span>Cancel</span>
                    </button>
                </div>
                <div
                    v-if="isEditing && revertBannerTitle"
                    class="edit-banner edit-banner--revert"
                    :class="{ 'edit-banner--conflict': revertConflictCount > 0 }"
                >
                    <WarningTriangle
                        v-if="revertConflictCount > 0"
                        width="12"
                        height="12"
                        class="edit-banner__warn"
                    />
                    <span class="edit-banner__text" v-text="revertBannerTitle"></span>
                    <label v-if="showRestoreToggle" class="edit-banner__toggle">
                        <input
                            type="checkbox"
                            :checked="restoreEnabled"
                            @change="handleToggleRestoreFiles"
                        />
                        <span>Restore AI files</span>
                    </label>
                </div>
                <ImageAttacher :images="attachedImages" :on-remove="resolved.onRemoveImage" />
                <div class="input-container">
                    <div class="input-main">
                        <textarea
                            ref="textareaRef"
                            v-model="input"
                            class="input-field"
                            :placeholder="effectivePlaceholder"
                            :disabled="resolved.disabled"
                            rows="1"
                            @keydown="onKeydown"
                            @input="onInputWithMention"
                            @keyup="onKeyupWithMention"
                            @click="onClickWithMention"
                        />
                    </div>
                    <div class="input-actions">
                        <button
                            v-if="canAttach"
                            class="action-btn attach-btn"
                            title="Attach images"
                            type="button"
                            @click="resolved.onPickImages?.()"
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true"
                            >
                                <path
                                    d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"
                                />
                            </svg>
                        </button>
                        <button
                            v-if="resolved.disabled"
                            class="action-btn stop-btn"
                            @click="handleStop"
                            title="Stop generating"
                            type="button"
                        >
                            <Xmark width="16" height="16" />
                        </button>
                        <button
                            v-else
                            class="action-btn send-btn"
                            :disabled="!canSend"
                            @click="handleSend"
                            title="Send message"
                            type="button"
                        >
                            <SendDiagonal width="16" height="16" />
                        </button>
                    </div>
                </div>
            </template>
        </MentionDropup>
        <div class="input-footer">
            <div class="input-footer__left">
                <button
                    class="thinking-toggle"
                    :class="{ 'thinking-toggle--active': thinkingEnabled }"
                    :title="thinkingEnabled ? 'Thinking enabled' : 'Thinking disabled'"
                    @click="toggleThinking"
                    type="button"
                >
                    <Brain width="11" height="11" />
                    <span>Thinking</span>
                </button>
                <DropdownRoot
                    v-if="thinkingEnabled"
                    :items="levelItems"
                    placement="top"
                    mode="select"
                    :model-value="currentLevel"
                    dense
                    :offset="4"
                    :width="{ mode: 'match-trigger' }"
                    :style="modelDropdownStyle"
                    @select="onLevelSelect"
                >
                    <template #trigger="{ isOpen, toggle }">
                        <button
                            class="thinking-level"
                            :class="{ 'thinking-level--open': isOpen }"
                            @click="toggle"
                            type="button"
                        >
                            <span>{{ currentLevel }}</span>
                            <NavArrowDown
                                width="10"
                                height="10"
                                stroke-width="2.5"
                                class="model-selector__chevron"
                                :class="{ 'model-selector__chevron--open': isOpen }"
                            />
                        </button>
                    </template>
                </DropdownRoot>
                <div
                    v-if="resolved.onChangeMode"
                    class="mode-toggle"
                    role="radiogroup"
                    aria-label="Chat mode"
                >
                    <button
                        v-for="m in CHAT_MODES"
                        :key="m.value"
                        class="mode-toggle__item"
                        :class="{ 'mode-toggle__item--active': m.value === currentMode }"
                        role="radio"
                        :aria-checked="m.value === currentMode"
                        :title="m.label"
                        type="button"
                        @click="selectMode(m.value)"
                    >
                        <component :is="m.icon" width="11" height="11" />
                        <span class="mode-toggle__label">{{ m.label }}</span>
                    </button>
                </div>
            </div>
            <div class="input-footer__right">
                <DropdownRoot
                    :items="resolved.modelItems"
                    placement="top"
                    mode="select"
                    :model-value="resolved.modelId"
                    dense
                    :offset="4"
                    :width="{ mode: 'match-trigger' }"
                    :style="modelDropdownStyle"
                    @select="onModelSelect"
                >
                    <template #trigger="{ isOpen, toggle }">
                        <button
                            class="model-selector"
                            :class="{ 'model-selector--open': isOpen }"
                            :disabled="resolved.modelItems.length === 0"
                            @click="toggle"
                            type="button"
                        >
                            <Cube width="12" height="12" />
                            <span class="model-selector__label">{{ resolved.selectedLabel }}</span>
                            <NavArrowDown
                                width="10"
                                height="10"
                                stroke-width="2.5"
                                class="model-selector__chevron"
                                :class="{ 'model-selector__chevron--open': isOpen }"
                            />
                        </button>
                    </template>
                </DropdownRoot>
            </div>
        </div>
    </div>
</template>
