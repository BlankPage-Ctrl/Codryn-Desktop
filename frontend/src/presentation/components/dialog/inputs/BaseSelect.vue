<script setup lang="ts">
import { computed } from 'vue'
import { NavArrowDown } from '@iconoir/vue'
import type { OptionItem } from '../types'

defineOptions({
    inheritAttrs: false,
})

type Props = {
    modelValue: unknown
    label?: string
    options: OptionItem[]
    placeholder?: string
    error?: string
    helperText?: string
    required?: boolean
    disabled?: boolean
    dense?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: 'Pilih opsi...',
    required: false,
    disabled: false,
    dense: false,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: unknown): void
    (e: 'change', value: unknown): void
}>()

const selectedValue = computed({
    get: () => props.modelValue,
    set: (val: unknown) => {
        emit('update:modelValue', val)
        emit('change', val)
    },
})
</script>

<template>
    <div class="select-field-group">
        <label v-if="label" class="base-label" :class="{ 'label-error': !!error }">
            {{ label }}
            <span v-if="required" class="required-indicator">*</span>
        </label>

        <div class="select-wrapper">
            <select
                v-model="selectedValue"
                :disabled="disabled"
                v-bind="$attrs"
                class="base-select"
                :class="{
                    'select-dense': dense,
                    'select-error': !!error,
                    'select-disabled': disabled,
                    'select-placeholder':
                        selectedValue === undefined ||
                        selectedValue === null ||
                        selectedValue === '',
                }"
            >
                <option value="" disabled selected>{{ placeholder }}</option>
                <option v-for="opt in options" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                </option>
            </select>
            <div class="select-arrow">
                <NavArrowDown width="16" height="16" />
            </div>
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
.select-field-group {
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

.select-wrapper {
    position: relative;
    width: 100%;
}

.base-select {
    width: 100%;
    height: 32px;
    padding: 0 32px 0 10px;
    font-size: var(--type-sm);
    border-radius: 4px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-primary);
    appearance: none;
    cursor: pointer;
    transition:
        border-color 150ms ease,
        box-shadow 150ms ease,
        background-color 150ms ease;
}

.base-select:hover:not(:disabled) {
    border-color: var(--border-color);
}

.base-select:focus:not(:disabled) {
    border-color: var(--border-color);
    box-shadow: 0 0 0 2px var(--border-color);
    outline: none;
}

.select-dense {
    height: 28px;
    padding: 0 28px 0 8px;
    font-size: var(--type-xs);
}

.select-placeholder {
    color: var(--text-primary);
}

.select-error {
    border-color: var(--color-danger) !important;
}

.select-error:focus:not(:disabled) {
    box-shadow: 0 0 0 2px var(--color-danger) !important;
}

.select-disabled {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    cursor: not-allowed;
    border-color: var(--border-color);
}

.select-arrow {
    position: absolute;
    top: 50%;
    right: 12px;
    transform: translateY(-50%);
    color: var(--text-primary);
    pointer-events: none;
    display: flex;
    align-items: center;
    transition: color 150ms ease;
}

.base-select:focus ~ .select-arrow {
    color: var(--border-color);
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
