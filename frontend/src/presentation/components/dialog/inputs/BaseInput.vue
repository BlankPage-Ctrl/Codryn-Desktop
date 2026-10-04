<script setup lang="ts">
import { computed } from 'vue'

defineOptions({
    inheritAttrs: false,
})

type Props = {
    modelValue: unknown
    label?: string
    type?: string
    placeholder?: string
    error?: string
    helperText?: string
    required?: boolean
    disabled?: boolean
    dense?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    type: 'text',
    placeholder: '',
    required: false,
    disabled: false,
    dense: false,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: unknown): void
    (e: 'blur', event: FocusEvent): void
    (e: 'focus', event: FocusEvent): void
}>()

const inputValue = computed({
    get: () => {
        const v = props.modelValue
        if (v == null) return ''
        return String(v)
    },
    set: (val: unknown) => {
        let finalVal: unknown = val
        if (props.type === 'number') {
            finalVal = val === '' ? null : Number(val)
        }
        emit('update:modelValue', finalVal)
    },
})

const handleBlur = (e: FocusEvent) => {
    emit('blur', e)
}

const handleFocus = (e: FocusEvent) => {
    emit('focus', e)
}
</script>

<template>
    <div class="input-field-group">
        <label v-if="label" class="base-label" :class="{ 'label-error': !!error }">
            {{ label }}
            <span v-if="required" class="required-indicator">*</span>
        </label>

        <div class="input-wrapper">
            <input
                :type="type"
                v-model="inputValue"
                :placeholder="placeholder"
                :disabled="disabled"
                @blur="handleBlur"
                @focus="handleFocus"
                v-bind="$attrs"
                class="base-input"
                :class="{
                    'input-dense': dense,
                    'input-error': !!error,
                    'input-disabled': disabled,
                }"
            />
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
.input-field-group {
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

.input-wrapper {
    position: relative;
    width: 100%;
}

.base-input {
    width: 100%;
    height: 32px;
    padding: 0 10px;
    font-size: var(--type-sm);
    border-radius: 4px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-primary);
    transition:
        border-color 150ms ease,
        box-shadow 150ms ease,
        background-color 150ms ease;
}

.base-input:hover:not(:disabled) {
    border-color: var(--border-color);
}

.base-input:focus:not(:disabled) {
    border-color: var(--border-color);
    box-shadow: 0 0 0 2px var(--border-color);
    background: var(--bg-primary);
}

.input-dense {
    height: 28px;
    padding: 0 8px;
    font-size: var(--type-xs);
}

.input-error {
    border-color: var(--color-danger) !important;
}

.input-error:focus:not(:disabled) {
    box-shadow: 0 0 0 2px var(--color-danger) !important;
}

.input-disabled {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    cursor: not-allowed;
    border-color: var(--border-color);
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
