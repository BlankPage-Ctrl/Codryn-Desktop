<script setup lang="ts">
import { computed, ref } from 'vue'
import { ListSelect } from '@iconoir/vue'
import type { HitlChoiceCardSchema } from '../types/schema'

const OTHER_ID = '__other__'

const props = defineProps<{
    schema: HitlChoiceCardSchema
}>()

const selected = ref<string[]>([...props.schema.defaultSelection])
const customInput = ref('')

const submitting = computed(() => props.schema.submitting)

const rankOf = computed<Record<string, number>>(() => {
    const ranks: Record<string, number> = {}
    selected.value.forEach((id, index) => {
        ranks[id] = index + 1
    })
    return ranks
})

function toggle(id: string): void {
    if (submitting.value) return
    if (props.schema.mode === 'single') {
        selected.value = [id]
        submit()
        return
    }
    const index = selected.value.indexOf(id)
    if (index === -1) {
        if (
            props.schema.maxSelect !== undefined &&
            selected.value.length >= props.schema.maxSelect
        ) {
            return
        }
        selected.value = [...selected.value, id]
    } else {
        selected.value = selected.value.filter((entry) => entry !== id)
    }
}

const selectionError = computed((): string | null => {
    if (props.schema.mode === 'single') return null
    if (props.schema.minSelect !== undefined && selected.value.length < props.schema.minSelect) {
        return `Select at least ${props.schema.minSelect} option(s)`
    }
    if (props.schema.maxSelect !== undefined && selected.value.length > props.schema.maxSelect) {
        return `Select at most ${props.schema.maxSelect} option(s)`
    }
    return null
})

const hasPerOptionCustomSelected = computed(() =>
    selected.value.some(
        (id) => props.schema.options.find((o) => o.id === id)?.allowCustomInput === true,
    ),
)

const needsCustomInput = computed(
    () =>
        (props.schema.allowOther && selected.value.includes(OTHER_ID)) ||
        hasPerOptionCustomSelected.value,
)

const canSubmit = computed(() => {
    if (submitting.value || selected.value.length === 0) return false
    if (needsCustomInput.value && !customInput.value.trim()) {
        return false
    }
    return !selectionError.value
})

function submit(): void {
    if (selected.value.length === 0 || submitting.value) return
    if (selectionError.value) return
    const custom = customInput.value.trim()
    const useCustom = needsCustomInput.value && Boolean(custom)
    props.schema.onSubmit(
        props.schema.id,
        selected.value.filter((id) => id !== OTHER_ID),
        useCustom ? custom : undefined,
    )
}

function dismiss(): void {
    props.schema.onDismiss(props.schema.id)
}
</script>

<template>
    <div class="hitl-card" data-testid="hitl-choice-card">
        <div class="hitl-card__header">
            <span class="hitl-card__icon">
                <ListSelect width="16" height="16" />
            </span>
            <span class="hitl-card__title">{{ schema.title }}</span>
            <span class="hitl-card__type">{{
                schema.mode === 'single' ? 'choose' : schema.mode
            }}</span>
        </div>
        <p v-if="schema.description" class="hitl-card__desc">{{ schema.description }}</p>
        <div>
            <button
                v-for="option in schema.options"
                :key="option.id"
                class="hitl-choice__option"
                :class="{ 'hitl-choice__option--selected': selected.includes(option.id) }"
                type="button"
                :disabled="submitting"
                @click="toggle(option.id)"
            >
                <span
                    v-if="schema.mode === 'ranked' && rankOf[option.id]"
                    class="hitl-choice__rank"
                >
                    {{ rankOf[option.id] }}
                </span>
                <span class="hitl-choice__option-body">
                    <span class="hitl-choice__option-title">{{ option.title }}</span>
                    <div v-if="option.description" class="hitl-choice__option-desc">
                        {{ option.description }}
                    </div>
                </span>
                <span v-if="option.recommended" class="hitl-choice__badge">recommended</span>
                <span v-if="option.allowCustomInput" class="hitl-choice__badge">custom</span>
            </button>
            <button
                v-if="schema.allowOther"
                class="hitl-choice__option"
                :class="{ 'hitl-choice__option--selected': selected.includes(OTHER_ID) }"
                type="button"
                :disabled="submitting"
                @click="toggle(OTHER_ID)"
            >
                <span class="hitl-choice__option-body">
                    <span class="hitl-choice__option-title">Other</span>
                </span>
            </button>
        </div>
        <textarea
            v-if="needsCustomInput"
            v-model="customInput"
            class="hitl-card__input"
            rows="2"
            :placeholder="
                hasPerOptionCustomSelected
                    ? 'Custom value for selected option'
                    : 'Describe your choice'
            "
            :disabled="submitting"
        />
        <p v-if="selectionError" class="hitl-card__error">{{ selectionError }}</p>
        <p v-else-if="schema.error" class="hitl-card__error">{{ schema.error }}</p>
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
                v-if="schema.mode !== 'single'"
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
