<script setup lang="ts">
import { computed } from 'vue'
import type { BlockPartSourceConfig } from '../types/schema'

const props = defineProps<{
    config?: BlockPartSourceConfig
}>()

const displayData = computed(() => {
    if (!props.config) return ''
    if (props.config.component) return ''

    const data = props.config.data
    if (data === undefined || data === null) return ''

    if (props.config.format === 'text') {
        return typeof data === 'string' ? data : JSON.stringify(data)
    }
    return JSON.stringify(data, null, 2)
})
</script>

<template>
    <div class="block-source">
        <component v-if="config?.component" :is="config.component" v-bind="config.props" />
        <pre v-else-if="displayData" class="block-source__pre">{{ displayData }}</pre>
        <slot v-else>
            <div class="block-source__empty">No source data</div>
        </slot>
    </div>
</template>

<style scoped>
.block-source {
    padding: 10px 12px;
}

.block-source__pre {
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
    opacity: 0.7;
    margin: 0;
    max-height: 300px;
    overflow-y: auto;
}

.block-source__empty {
    font-size: var(--type-xs);
    opacity: 0.4;
    font-style: italic;
}
</style>
