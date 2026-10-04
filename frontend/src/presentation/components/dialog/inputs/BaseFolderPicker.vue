<script setup lang="ts">
import { computed, ref } from 'vue'
import { Folder } from '@iconoir/vue'
import { pickDirectory } from '@/data/services/files.service'

defineOptions({
    inheritAttrs: false,
})

type Props = {
    modelValue: unknown
    label?: string
    placeholder?: string
    error?: string
    helperText?: string
    required?: boolean
    disabled?: boolean
    dense?: boolean
    buttonText?: string
}

const props = withDefaults(defineProps<Props>(), {
    label: '',
    placeholder: 'No folder selected',
    required: false,
    disabled: false,
    dense: false,
    buttonText: 'Open Folder',
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: unknown): void
    (e: 'input'): void
}>()

const busy = ref(false)

const valueText = computed(() => {
    const v = props.modelValue
    if (v == null || String(v).trim() === '') return ''
    return String(v)
})

const handleClick = async () => {
    if (props.disabled || busy.value) return
    busy.value = true
    try {
        const path = await pickDirectory('Select project folder', valueText.value)
        if (path) {
            emit('update:modelValue', path)
            emit('input')
        }
    } catch (e) {
        console.error('[FolderPicker] failed to open directory:', e)
    } finally {
        busy.value = false
    }
}
</script>

<template>
    <div class="folder-field-group">
        <label v-if="label" class="base-label" :class="{ 'label-error': !!error }">
            {{ label }}
            <span v-if="required" class="required-indicator">*</span>
        </label>

        <button
            type="button"
            class="folder-picker"
            :class="{
                'picker-dense': dense,
                'picker-error': !!error,
                'picker-disabled': disabled || busy,
            }"
            :disabled="disabled || busy"
            @click="handleClick"
        >
            <span class="picker-icon"><Folder width="16" height="16" /></span>
            <span class="picker-label">
                {{ busy ? 'Opening…' : buttonText }}
            </span>
        </button>

        <div class="picker-value" :class="{ 'picker-value-dense': dense }" :title="valueText">
            <span v-if="valueText" class="value-text">{{ valueText }}</span>
            <span v-else class="value-placeholder">{{ placeholder }}</span>
        </div>

        <div class="message-container">
            <transition name="slide-fade" mode="out-in">
                <span v-if="error" class="error-text" :key="error">{{ error }}</span>
                <span v-else-if="helperText" class="helper-text" :key="helperText">{{
                    helperText
                }}</span>
            </transition>
        </div>
    </div>
</template>

<style scoped>
.folder-field-group {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.base-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--type-2xs);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    opacity: 0.55;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
    user-select: none;
    transition: color 150ms ease;
}

.label-error {
    color: var(--color-danger);
    opacity: 0.8;
}

.required-indicator {
    color: var(--color-danger);
}

.folder-picker {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    height: 32px;
    padding: 0 10px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    background-color: transparent;
    color: var(--text-primary);
    font-family: inherit;
    font-size: var(--type-sm);
    font-weight: var(--font-weight-medium);
    line-height: 1;
    white-space: nowrap;
    user-select: none;
    opacity: 0.75;
    cursor: pointer;
    transition:
        opacity 150ms ease,
        background-color 150ms ease,
        border-color 150ms ease,
        box-shadow 150ms ease;
}

.folder-picker:hover:not(:disabled) {
    background-color: rgba(var(--raw-border-color), 0.3);
    border-color: var(--border-color);
    opacity: 1;
}

.folder-picker:focus-visible:not(:disabled) {
    outline: none;
    border-color: var(--border-color);
    box-shadow: 0 0 0 2px var(--border-color);
    opacity: 1;
}

.folder-picker .picker-icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    line-height: 0;
}

.picker-dense {
    height: 28px;
    padding: 0 8px;
    font-size: var(--type-xs);
    gap: 4px;
}

.picker-error {
    border-color: var(--color-danger);
    opacity: 0.85;
}

.picker-disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.picker-value {
    width: 100%;
    margin-top: 4px;
    font-size: var(--type-xs);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    user-select: none;
}

.picker-value-dense {
    margin-top: 3px;
}

.value-text {
    color: var(--text-primary);
    opacity: 0.75;
}

.value-placeholder {
    color: var(--text-primary);
    opacity: 0.35;
}

.message-container {
    min-height: 18px;
    margin-top: 4px;
}

.error-text {
    display: block;
    font-size: var(--type-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-danger);
    line-height: 1.2;
}

.helper-text {
    display: block;
    font-size: var(--type-xs);
    color: var(--text-primary);
    opacity: 0.45;
    line-height: 1.2;
}

/* Transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: all 120ms ease-out;
}

.slide-fade-enter-from {
    opacity: 0;
    transform: translateY(-2px);
}

.slide-fade-leave-to {
    opacity: 0;
    transform: translateY(2px);
}
</style>
