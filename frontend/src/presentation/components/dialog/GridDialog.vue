<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { Xmark } from '@iconoir/vue'
import type { DialogGridSchema, DynamicGridDataOutput } from './types.ts'
import DynamicGridForm from './GridForm.vue'
import { useEventListener } from '@vueuse/core'

type Props = {
    modelValue: boolean
    schema?: DialogGridSchema
    title: string
    confirmLabel?: string
    cancelLabel?: string
    width?: 'sm' | 'md' | 'lg' | 'xl'
    initialData?: DynamicGridDataOutput
    dense?: boolean
    loading?: boolean
    closeOnBackdrop?: boolean
    confirmVariant?: 'primary' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
    confirmLabel: 'Save',
    cancelLabel: 'Cancel',
    width: 'md',
    dense: true,
    loading: false,
    closeOnBackdrop: true,
    confirmVariant: 'primary',
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'submit', value: DynamicGridDataOutput): void
    (e: 'cancel'): void
    (e: 'change', value: DynamicGridDataOutput): void
}>()

const formRef = ref<InstanceType<typeof DynamicGridForm> | null>(null)
const dialogRef = ref<HTMLElement | null>(null)
const outputData = ref<DynamicGridDataOutput>({})

watch(
    outputData,
    (newVal) => {
        emit('change', newVal)
    },
    { deep: true },
)
let previouslyFocusedElement: HTMLElement | null = null

const close = () => {
    if (props.loading) return
    emit('update:modelValue', false)
}

const handleCancel = () => {
    if (props.loading) return
    emit('cancel')
    close()
}

const handleConfirm = () => {
    if (props.loading) return

    if (formRef.value && !formRef.value.validate()) {
        // Scroll first invalid field into view
        setTimeout(() => {
            const firstError = dialogRef.value?.querySelector('.error-text')
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        }, 50)
        return
    }

    emit('submit', outputData.value)
    close()
}

const handleBackdropClick = () => {
    if (props.closeOnBackdrop) {
        close()
    }
}

// Focus Trap Logic
const getFocusableElements = (): HTMLElement[] => {
    if (!dialogRef.value) return []
    return Array.from(
        dialogRef.value.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
    ) as HTMLElement[]
}

const handleTab = (e: KeyboardEvent) => {
    const focusables = getFocusableElements().filter(
        (el) => !el.hasAttribute('disabled') && el.style.display !== 'none',
    )
    if (focusables.length === 0) {
        e.preventDefault()
        return
    }

    const first = focusables[0]!
    const last = focusables[focusables.length - 1]!
    const active = document.activeElement as HTMLElement

    if (e.shiftKey) {
        if (active === first) {
            last.focus()
            e.preventDefault()
        }
    } else {
        if (active === last) {
            first.focus()
            e.preventDefault()
        }
    }
}

let cleanupDialogKeydown: (() => void) | null = null

function handleDialogKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
        e.preventDefault()
        close()
    } else if (e.key === 'Tab') {
        handleTab(e)
    }
}

watch(
    () => props.modelValue,
    (open) => {
        cleanupDialogKeydown?.()
        cleanupDialogKeydown = null
        if (open) {
            const stop = useEventListener(window, 'keydown', handleDialogKeydown)
            cleanupDialogKeydown = () => stop()
        }
    },
)

onUnmounted(() => cleanupDialogKeydown?.())

// Watch modal state for focus management
watch(
    () => props.modelValue,
    (newVal) => {
        if (newVal) {
            previouslyFocusedElement = document.activeElement as HTMLElement

            // Focus first input field when open
            setTimeout(() => {
                const focusables = getFocusableElements()
                if (focusables.length > 0) {
                    // If first item is close button, try to focus first actual input if possible
                    const firstInput = dialogRef.value?.querySelector(
                        'input, select, textarea',
                    ) as HTMLElement
                    if (firstInput) {
                        firstInput.focus()
                    } else {
                        focusables[0]?.focus()
                    }
                }
            }, 120)
        } else {
            if (previouslyFocusedElement) {
                previouslyFocusedElement.focus()
            }
        }
    },
)
</script>

<template>
    <transition name="dialog-fade">
        <div v-if="modelValue" class="dialog-overlay" @click="handleBackdropClick">
            <div
                ref="dialogRef"
                class="dialog-panel"
                :class="[`width-${width}`, { 'dialog-panel--dense': dense }]"
                @click.stop
            >
                <!-- Header -->
                <div class="dialog-header">
                    <h3 class="dialog-title">{{ title }}</h3>
                    <button class="btn-close" @click="close" title="Tutup" :disabled="loading">
                        <Xmark width="18" height="18" />
                    </button>
                </div>

                <!-- Content Body -->
                <div class="dialog-body">
                    <slot>
                        <DynamicGridForm
                            v-if="schema"
                            ref="formRef"
                            :schema="schema"
                            :initial-data="initialData"
                            :dense="dense"
                            v-model="outputData"
                        />
                    </slot>
                </div>

                <!-- Footer Actions -->
                <div class="dialog-footer">
                    <button class="btn-cancel" :disabled="loading" @click="handleCancel">
                        {{ cancelLabel }}
                    </button>
                    <button
                        class="btn-confirm"
                        :class="{ 'btn-danger': confirmVariant === 'danger' }"
                        :disabled="loading"
                        @click="handleConfirm"
                    >
                        <span v-if="loading" class="spinner-inline"></span>
                        {{ loading ? 'Processing...' : confirmLabel }}
                    </button>
                </div>
            </div>
        </div>
    </transition>
</template>

<style scoped>
.dialog-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background-color: rgba(15, 15, 20, 0.45);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
}

.dialog-panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: 90vh;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    box-shadow:
        0 4px 8px rgba(15, 15, 20, 0.06),
        0 12px 24px rgba(15, 15, 20, 0.05);
    overflow: hidden;
}

.width-sm {
    max-width: 400px;
}
.width-md {
    max-width: 560px;
}
.width-lg {
    max-width: 720px;
}
.width-xl {
    max-width: 960px;
}

/* Header */
.dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px 8px;
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
}

.dialog-title {
    font-family: var(--font-serif);
    font-size: var(--type-xl);
    font-weight: var(--font-weight-semibold);
    letter-spacing: -0.01em;
    color: var(--text-primary);
    margin: 0;
}

.btn-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    color: var(--text-primary);
    cursor: pointer;
    transition:
        background-color 150ms ease,
        color 150ms ease;
}

.btn-close:hover:not(:disabled) {
    background-color: rgba(var(--raw-border-color), 0.3);
    color: var(--text-primary);
}

.btn-close:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Body */
.dialog-body {
    padding: 14px 20px;
    overflow-y: auto;
    flex: 1;
}

/* Unified scrollbar inside modal body */
.dialog-body::-webkit-scrollbar {
    width: 4px;
}
.dialog-body::-webkit-scrollbar-track {
    background: transparent;
}
.dialog-body::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
}
.dialog-body::-webkit-scrollbar-thumb:hover {
    background: var(--border-color);
}

/* Footer */
.dialog-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 10px 20px 14px;
    border-top: 1px solid var(--border-color);
    background-color: var(--bg-secondary);
    flex-shrink: 0;
}

/* Buttons */
.btn-confirm {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 30px;
    padding: 0 12px;
    border-radius: 4px;
    background-color: var(--border-color);
    color: var(--text-primary);
    font-size: var(--type-sm);
    font-weight: var(--font-weight-semibold);
    opacity: 0.6;
    transition:
        opacity 150ms ease,
        background-color 150ms ease;
}

.btn-confirm:hover:not(:disabled) {
    opacity: 2;
}

.btn-confirm:disabled {
    opacity: 0.25;
    cursor: not-allowed;
}

.btn-cancel {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    padding: 0 10px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    background-color: transparent;
    color: var(--text-primary);
    font-size: var(--type-sm);
    font-weight: var(--font-weight-medium);
    opacity: 0.5;
    transition:
        opacity 150ms ease,
        background-color 150ms ease,
        border-color 150ms ease;
}

.btn-cancel:hover:not(:disabled) {
    background-color: rgba(var(--raw-border-color), 0.3);
    border-color: var(--border-color);
    opacity: 1;
}

.btn-cancel:disabled {
    opacity: 0.2;
    cursor: not-allowed;
}

.btn-confirm.btn-danger {
    background-color: var(--color-danger);
    opacity: 0.7;
}

.btn-confirm.btn-danger:hover:not(:disabled) {
    background-color: var(--color-danger);
    opacity: 1;
}

.spinner-inline {
    width: 14px;
    height: 14px;
    border: 2px solid var(--bg-primary);
    border-radius: 50%;
    border-top-color: var(--bg-primary);
    animation: spin 800ms linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Animations */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
    transition: opacity 200ms ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
    opacity: 0;
}

.dialog-fade-enter-active .dialog-panel {
    animation: zoomIn 200ms cubic-bezier(0.2, 0, 0, 1) forwards;
}

.dialog-fade-leave-active .dialog-panel {
    animation: zoomOut 150ms cubic-bezier(0.2, 0, 0, 1) forwards;
}

@keyframes zoomIn {
    from {
        transform: scale(0.96) translateY(8px);
        opacity: 0;
    }
    to {
        transform: scale(1) translateY(0);
        opacity: 1;
    }
}

@keyframes zoomOut {
    from {
        transform: scale(1) translateY(0);
        opacity: 1;
    }
    to {
        transform: scale(0.96) translateY(8px);
        opacity: 0;
    }
}

/* Dense variant */
.dialog-panel--dense .dialog-header {
    padding: 8px 16px 6px;
}

.dialog-panel--dense .dialog-title {
    font-size: var(--type-md);
}

.dialog-panel--dense .btn-close {
    width: 22px;
    height: 22px;
}

.dialog-panel--dense .dialog-body {
    padding: 10px 14px;
}

.dialog-panel--dense .dialog-footer {
    gap: 4px;
    padding: 6px 14px 10px;
}

.dialog-panel--dense .btn-confirm {
    height: 26px;
    padding: 0 10px;
    border-radius: 4px;
    font-size: var(--type-xs);
}

.dialog-panel--dense .btn-cancel {
    height: 26px;
    padding: 0 8px;
    border-radius: 4px;
    font-size: var(--type-xs);
}

.dialog-panel--dense .spinner-inline {
    width: 10px;
    height: 10px;
}
</style>
