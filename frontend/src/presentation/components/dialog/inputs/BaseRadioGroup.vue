<script setup lang="ts">
import { computed } from 'vue'
import type { OptionItem } from '../types'

type Props = {
    modelValue: unknown
    label?: string
    options: OptionItem[]
    error?: string
    helperText?: string
    required?: boolean
    disabled?: boolean
    row?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    required: false,
    disabled: false,
    row: false,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: unknown): void
}>()

const selectedValue = computed({
    get: () => props.modelValue,
    set: (val: unknown) => {
        if (!props.disabled) {
            emit('update:modelValue', val)
        }
    },
})
</script>

<template>
    <div class="radio-field-group">
        <label v-if="label" class="base-label" :class="{ 'label-error': !!error }">
            {{ label }}
            <span v-if="required" class="required-indicator">*</span>
        </label>

        <div :class="['radio-options-container', { 'row-layout': row }]">
            <label
                v-for="opt in options"
                :key="String(opt.value)"
                class="radio-label"
                :class="{ 'radio-disabled': disabled }"
            >
                <input
                    type="radio"
                    :value="opt.value"
                    v-model="selectedValue"
                    :disabled="disabled"
                    class="hidden-radio"
                />
                <div
                    class="custom-radio"
                    :class="{
                        'custom-radio-checked': selectedValue === opt.value,
                        'custom-radio-error': !!error,
                    }"
                >
                    <div class="radio-dot"></div>
                </div>
                <span class="option-text">{{ opt.label }}</span>
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
.radio-field-group {
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

.radio-options-container {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.row-layout {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 20px;
}

.radio-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--type-sm);
    color: var(--text-primary);
    cursor: pointer;
    user-select: none;
}

.hidden-radio {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
}

.custom-radio {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    transition:
        border-color 150ms ease,
        box-shadow 150ms ease;
}

.radio-label:hover .custom-radio:not(.radio-disabled *) {
    border-color: var(--border-color);
}

.custom-radio-checked {
    border-color: var(--border-color) !important;
}

.custom-radio-checked .radio-dot {
    transform: scale(1);
}

.custom-radio-error {
    border-color: var(--color-danger) !important;
}

.radio-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--border-color);
    transform: scale(0);
    transition: transform 150ms cubic-bezier(0.2, 0, 0, 1);
}

.radio-disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.radio-disabled .custom-radio {
    background: var(--bg-secondary);
    border-color: var(--border-color);
}

.radio-disabled .radio-dot {
    background: var(--text-primary);
}

.option-text {
    font-size: var(--type-sm);
    line-height: 1;
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
