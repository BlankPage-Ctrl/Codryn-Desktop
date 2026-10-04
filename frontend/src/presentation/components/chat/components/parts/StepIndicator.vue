<script setup lang="ts">
import { computed } from 'vue'
import type { StepIndicatorSchema } from '../../types/schema'
import { resolveStepIndicatorSchema } from '../../resolver/resolvePartsSchema'

const props = defineProps<{
    schema: StepIndicatorSchema
}>()

const resolved = computed(() => resolveStepIndicatorSchema(props.schema))
</script>

<template>
    <div class="step-indicator">
        <span v-if="resolved.label" class="step-label">{{ resolved.label }}</span>
    </div>
</template>
