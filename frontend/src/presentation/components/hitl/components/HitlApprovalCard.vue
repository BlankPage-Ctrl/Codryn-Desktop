<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { WarningTriangle } from '@iconoir/vue'
import type { HitlApprovalCardSchema } from '../types/schema'

const props = defineProps<{
    schema: HitlApprovalCardSchema
}>()

const showRejectReason = ref(false)
const rejectReason = ref('')

const showModification = ref(false)
const modificationNote = ref(props.schema.modificationDraft ?? '')

const submitting = computed(() => props.schema.submitting)
const canApproveWithModification = computed(() => {
    const v = modificationNote.value.trim()
    return Boolean(v && v !== (props.schema.modificationDraft ?? '').trim())
})

watch(
    () => props.schema.modificationDraft,
    (next) => {
        if (!showModification.value) modificationNote.value = next ?? ''
    },
)

function approve(always: boolean): void {
    props.schema.onApprove(props.schema.id, always)
}

function approveWithModification(): void {
    if (!props.schema.supportsModification) return
    if (!showModification.value) {
        showModification.value = true
        return
    }
    const note = modificationNote.value.trim()
    if (!note) return
    props.schema.onApproveWithModification(props.schema.id, note)
}

function deny(): void {
    if (props.schema.requireReasonOnReject && !showRejectReason.value) {
        showRejectReason.value = true
        return
    }
    const reason = rejectReason.value.trim()
    props.schema.onDeny(props.schema.id, reason ? reason : undefined)
}
</script>

<template>
    <div class="hitl-card" data-testid="hitl-approval-card">
        <div class="hitl-card__header">
            <span class="hitl-card__icon">
                <WarningTriangle width="16" height="16" />
            </span>
            <span class="hitl-card__title">{{ schema.title }}</span>
            <span class="hitl-card__type">approval</span>
        </div>
        <p v-if="schema.description" class="hitl-card__desc">{{ schema.description }}</p>
        <div v-if="schema.details.length" class="hitl-card__detail">
            <div v-for="row in schema.details" :key="row.key" class="hitl-card__detail-row">
                <span class="hitl-card__detail-key">{{ row.key }}</span>
                <span>{{ row.value }}</span>
            </div>
        </div>
        <textarea
            v-if="showRejectReason"
            v-model="rejectReason"
            class="hitl-card__input"
            rows="2"
            placeholder="Reason for rejection (required)"
            :disabled="submitting"
        />
        <div v-if="schema.supportsModification" class="hitl-card__modification">
            <label class="hitl-card__modification-label">{{ schema.modificationLabel }}</label>
            <textarea
                v-if="showModification"
                v-model="modificationNote"
                class="hitl-card__input hitl-card__input--modification"
                rows="3"
                :placeholder="schema.modificationPlaceholder"
                :disabled="submitting"
                data-testid="hitl-modification-input"
            />
            <p v-if="showModification" class="hitl-card__hint">
                Edit before approving. Will be validated before execution.
            </p>
        </div>
        <p v-if="schema.error" class="hitl-card__error">{{ schema.error }}</p>
        <div class="hitl-card__actions">
            <button
                class="hitl-btn hitl-btn--ghost"
                type="button"
                :disabled="submitting"
                @click="deny"
            >
                {{ showRejectReason ? 'Confirm deny' : 'Deny' }}
            </button>
            <button
                v-if="schema.supportsModification"
                class="hitl-btn hitl-btn--secondary"
                type="button"
                :disabled="submitting || (showModification && !canApproveWithModification)"
                data-testid="hitl-approve-with-modification"
                @click="approveWithModification"
            >
                {{ showModification ? 'Approve with edits' : 'Edit & approve' }}
            </button>
            <button
                class="hitl-btn hitl-btn--secondary"
                type="button"
                :disabled="submitting"
                @click="approve(true)"
            >
                Allow always
            </button>
            <button
                class="hitl-btn hitl-btn--primary"
                type="button"
                :disabled="submitting"
                @click="approve(false)"
            >
                Allow once
            </button>
        </div>
    </div>
</template>

<style scoped src="../styles/index.css"></style>
