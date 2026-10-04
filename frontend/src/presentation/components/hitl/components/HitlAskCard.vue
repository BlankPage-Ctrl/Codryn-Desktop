<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChatBubbleQuestion } from '@iconoir/vue'
import type { HitlAskCardSchema } from '../types/schema'

const props = defineProps<{
    schema: HitlAskCardSchema
}>()

const answers = ref<Record<string, string>>({})
const singleValue = ref('')

const submitting = computed(() => props.schema.submitting)
const steps = computed(() => props.schema.steps)
const isWizard = computed(
    () => steps.value.length > 1 || (steps.value[0]?.key ?? 'value') !== 'value',
)

function currentValue(): string {
    if (!isWizard.value) return singleValue.value
    const step = steps.value[0]
    if (!step) return ''
    if (steps.value.length === 1) return answers.value[step.key] ?? ''
    return JSON.stringify(
        Object.fromEntries(steps.value.map((entry) => [entry.key, answers.value[entry.key] ?? ''])),
    )
}

const validationError = computed((): string | null => {
    if (isWizard.value && steps.value.length > 1) return null
    const value = currentValue()
    if (props.schema.minLength !== undefined && value.trim().length < props.schema.minLength) {
        return `Minimum ${props.schema.minLength} characters required`
    }
    if (props.schema.maxLength !== undefined && value.length > props.schema.maxLength) {
        return `Maximum ${props.schema.maxLength} characters allowed`
    }
    if (props.schema.validationRegex) {
        try {
            if (!new RegExp(props.schema.validationRegex).test(value)) {
                return 'Value does not match the required format'
            }
        } catch {
            return null
        }
    }
    return null
})

const canSubmit = computed(() => {
    if (submitting.value) return false
    if (isWizard.value && steps.value.length > 1) {
        return steps.value.every((step) => (answers.value[step.key] ?? '').trim().length > 0)
    }
    return currentValue().trim().length > 0 && !validationError.value
})

function submit(): void {
    if (!canSubmit.value) return
    props.schema.onSubmit(props.schema.id, currentValue())
}

function dismiss(): void {
    props.schema.onDismiss(props.schema.id)
}
</script>

<template>
    <div class="hitl-card" data-testid="hitl-ask-card">
        <div class="hitl-card__header">
            <span class="hitl-card__icon">
                <ChatBubbleQuestion width="16" height="16" />
            </span>
            <span class="hitl-card__title">{{ schema.title }}</span>
            <span class="hitl-card__type">input</span>
        </div>
        <p v-if="schema.description" class="hitl-card__desc">{{ schema.description }}</p>
        <template v-if="isWizard">
            <div v-for="step in steps" :key="step.key">
                <p v-if="step.prompt" class="hitl-card__desc">{{ step.prompt }}</p>
                <textarea
                    :value="answers[step.key] ?? ''"
                    class="hitl-card__input"
                    rows="2"
                    :placeholder="step.placeholder ?? 'Your answer'"
                    :disabled="submitting"
                    @input="answers[step.key] = ($event.target as HTMLTextAreaElement).value"
                    @keydown.enter.exact.prevent="submit"
                />
            </div>
        </template>
        <textarea
            v-else
            v-model="singleValue"
            class="hitl-card__input"
            rows="2"
            :placeholder="steps[0]?.placeholder ?? 'Type your answer'"
            :disabled="submitting"
            @keydown.enter.exact.prevent="submit"
        />
        <p v-if="validationError" class="hitl-card__error">{{ validationError }}</p>
        <p v-else-if="schema.error" class="hitl-card__error">{{ schema.error }}</p>
        <p v-else-if="schema.minLength || schema.maxLength" class="hitl-card__hint">
            <template v-if="schema.minLength">min {{ schema.minLength }}</template>
            <template v-if="schema.minLength && schema.maxLength"> · </template>
            <template v-if="schema.maxLength">max {{ schema.maxLength }} chars</template>
        </p>
        <div class="hitl-card__actions">
            <button
                class="hitl-btn hitl-btn--ghost"
                type="button"
                :disabled="submitting"
                @click="dismiss"
            >
                Dismiss
            </button>
            <button
                class="hitl-btn hitl-btn--primary"
                type="button"
                :disabled="!canSubmit"
                @click="submit"
            >
                Submit
            </button>
        </div>
    </div>
</template>

<style scoped src="../styles/index.css"></style>
