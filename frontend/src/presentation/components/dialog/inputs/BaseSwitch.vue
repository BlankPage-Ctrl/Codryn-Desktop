<script setup lang="ts">
import { computed } from 'vue'

type Props = {
    modelValue: unknown
    label?: string
    error?: string
    helperText?: string
    disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: unknown): void
}>()

const isChecked = computed({
    get: () => !!props.modelValue,
    set: (val) => {
        if (!props.disabled) {
            emit('update:modelValue', val)
        }
    },
})
</script>

<template>
    <div class="switch-field-group">
        <label class="switch-label" :class="{ 'switch-disabled': disabled }">
            <input type="checkbox" v-model="isChecked" :disabled="disabled" class="hidden-switch" />
            <div
                class="custom-switch"
                :class="{
                    'custom-switch-checked': isChecked,
                    'custom-switch-error': !!error,
                }"
            >
                <div class="switch-thumb" :class="{ 'switch-thumb-checked': isChecked }"></div>
            </div>
            <span v-if="label" class="label-text">{{ label }}</span>
        </label>

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
.switch-field-group {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.switch-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
}

.hidden-switch {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
}

.custom-switch {
    position: relative;
    width: 30px;
    height: 18px;
    border-radius: 9999px;
    background-color: var(--border-color);
    border: 1px solid var(--border-color);
    transition:
        background-color 180ms ease,
        border-color 180ms ease;
    flex-shrink: 0;
}

.custom-switch-checked {
    background-color: var(--border-color) !important;
    border-color: var(--border-color) !important;
}

.custom-switch-error {
    border-color: var(--color-danger) !important;
}

.switch-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: var(--bg-primary);
    transition: transform 180ms cubic-bezier(0.2, 0, 0, 1);
    box-shadow: 0 1px 2px rgba(15, 15, 20, 0.15);
}

.switch-thumb-checked {
    transform: translateX(12px);
}

.label-text {
    font-size: var(--type-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
}

.switch-disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.switch-disabled .custom-switch {
    background-color: var(--bg-secondary);
    border-color: var(--border-color);
}

.switch-disabled .custom-switch-checked {
    background-color: var(--border-color) !important;
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
