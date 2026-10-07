<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    used: number
    limit: number
    percent: number
}>()

const RADIUS = 7
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function formatTokens(value: number): string {
    return Math.max(0, Math.round(value)).toLocaleString('en-US')
}

const clampedPercent = computed(() => Math.min(100, Math.max(0, Math.round(props.percent))))
const dashOffset = computed(() => CIRCUMFERENCE * (1 - clampedPercent.value / 100))
const percentLabel = computed(() => `${clampedPercent.value}%`)
const detailLabel = computed(
    () => `${formatTokens(props.used)}/${formatTokens(props.limit)} tokens`,
)
const accessibleLabel = computed(() => `Chat token usage: ${detailLabel.value}`)
</script>

<template>
    <div class="token-donut" role="img" :aria-label="accessibleLabel">
        <svg
            class="token-donut__ring"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            aria-hidden="true"
        >
            <circle cx="9" cy="9" :r="RADIUS" class="token-donut__track" />
            <circle
                cx="9"
                cy="9"
                :r="RADIUS"
                class="token-donut__fill"
                :stroke-dasharray="CIRCUMFERENCE"
                :stroke-dashoffset="dashOffset"
                transform="rotate(-90 9 9)"
            />
        </svg>
        <span class="token-donut__percent">{{ percentLabel }}</span>
        <span class="token-donut__detail">{{ detailLabel }}</span>
    </div>
</template>
