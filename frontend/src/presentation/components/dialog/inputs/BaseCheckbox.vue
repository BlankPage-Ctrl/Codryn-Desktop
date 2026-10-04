<script setup lang="ts">
import { computed } from 'vue'
import { Check } from '@iconoir/vue'
import type { OptionItem } from '../types'

type Props = {
    modelValue: unknown
    label?: string // Group label or single label
    options?: OptionItem[] // For checkbox groups
    value?: unknown // Value for single checkbox in an array (if no options list)
    error?: string
    helperText?: string
    required?: boolean
    disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    required: false,
    disabled: false,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: unknown): void
}>()

const isGroup = computed(() => !!props.options && props.options.length > 0)

// Single checkbox computed model
const isSingleChecked = computed({
    get: () => {
        if (Array.isArray(props.modelValue)) {
            return props.modelValue.includes(props.value)
        }
        return !!props.modelValue
    },
    set: (checked) => {
        if (props.disabled) return
        if (Array.isArray(props.modelValue)) {
            const newVal = [...props.modelValue]
            if (checked) {
                if (!newVal.includes(props.value)) {
                    newVal.push(props.value)
                }
            } else {
                const index = newVal.indexOf(props.value)
                if (index > -1) {
                    newVal.splice(index, 1)
                }
            }
            emit('update:modelValue', newVal)
        } else {
            emit('update:modelValue', checked)
        }
    },
})

// Helper for group checkbox items
const isGroupItemChecked = (val: unknown) => {
    if (Array.isArray(props.modelValue)) {
        return props.modelValue.includes(val)
    }
    return false
}

function handleGroupChange(optValue: unknown, e: Event) {
    if (e.target instanceof HTMLInputElement) {
        toggleGroupItem(optValue, e.target.checked)
    }
}

const toggleGroupItem = (val: unknown, checked: boolean) => {
    if (props.disabled) return
    const currentArray = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    if (checked) {
        if (!currentArray.includes(val)) {
            currentArray.push(val)
        }
    } else {
        const index = currentArray.indexOf(val)
        if (index > -1) {
            currentArray.splice(index, 1)
        }
    }
    emit('update:modelValue', currentArray)
}
</script>

<template>
    <div class="checkbox-field-group">
        <!-- Group label -->
        <label v-if="isGroup && label" class="base-label" :class="{ 'label-error': !!error }">
            {{ label }}
            <span v-if="required" class="required-indicator">*</span>
        </label>

        <!-- Checkbox Group List -->
        <div v-if="isGroup" class="checkbox-options-container">
            <label
                v-for="opt in options"
                :key="opt.value"
                class="checkbox-label"
                :class="{ 'checkbox-disabled': disabled }"
            >
                <input
                    type="checkbox"
                    :value="opt.value"
                    :checked="isGroupItemChecked(opt.value)"
                    :disabled="disabled"
                    @change="(e: Event) => handleGroupChange(opt.value, e)"
                    class="hidden-checkbox"
                />
                <div
                    class="custom-checkbox"
                    :class="{
                        'custom-checkbox-checked': isGroupItemChecked(opt.value),
                        'custom-checkbox-error': !!error,
                    }"
                >
                    <Check class="check-mark" width="12" height="12" stroke-width="3" />
                </div>
                <span class="option-text">{{ opt.label }}</span>
            </label>
        </div>

        <!-- Single Checkbox -->
        <div v-else class="single-checkbox-container">
            <label class="checkbox-label" :class="{ 'checkbox-disabled': disabled }">
                <input
                    type="checkbox"
                    v-model="isSingleChecked"
                    :disabled="disabled"
                    class="hidden-checkbox"
                />
                <div
                    class="custom-checkbox"
                    :class="{
                        'custom-checkbox-checked': isSingleChecked,
                        'custom-checkbox-error': !!error,
                    }"
                >
                    <Check class="check-mark" width="12" height="12" stroke-width="3" />
                </div>
                <span class="option-text single-label-text">
                    {{ label }}
                    <span v-if="required" class="required-indicator">*</span>
                </span>
            </label>
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
.checkbox-field-group {
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
    margin-bottom: 6px;
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

.checkbox-options-container {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--type-sm);
    color: var(--text-primary);
    cursor: pointer;
    user-select: none;
}

.hidden-checkbox {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
}

.custom-checkbox {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 3px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--bg-primary);
    transition:
        border-color 150ms ease,
        background-color 150ms ease,
        box-shadow 150ms ease;
}

.checkbox-label:hover .custom-checkbox:not(.checkbox-disabled *) {
    border-color: var(--border-color);
}

.custom-checkbox-checked {
    border-color: var(--border-color) !important;
    background-color: var(--border-color) !important;
}

.check-mark {
    opacity: 0;
    transform: scale(0.6);
    transition:
        opacity 120ms ease,
        transform 120ms cubic-bezier(0.2, 0, 0, 1);
}

.custom-checkbox-checked .check-mark {
    opacity: 1;
    transform: scale(1);
}

.custom-checkbox-error {
    border-color: var(--color-danger) !important;
}

.checkbox-disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.checkbox-disabled .custom-checkbox {
    background: var(--bg-secondary);
    border-color: var(--border-color);
}

.checkbox-disabled .custom-checkbox-checked {
    background-color: var(--border-color) !important;
}

.option-text {
    font-size: var(--type-sm);
    line-height: 1;
}

.single-label-text {
    font-weight: var(--font-weight-medium);
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
