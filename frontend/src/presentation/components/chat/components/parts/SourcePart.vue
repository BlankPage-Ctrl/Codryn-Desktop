<script setup lang="ts">
import { computed } from 'vue'
import type { SourcePartSchema } from '../../types/schema'
import { resolveSourcePartSchema } from '../../resolver/resolvePartsSchema'

const props = defineProps<{
    schema: SourcePartSchema
}>()

const resolved = computed(() => resolveSourcePartSchema(props.schema))
</script>

<template>
    <a
        v-if="resolved.isLink"
        :href="resolved.url"
        target="_blank"
        rel="noopener noreferrer"
        class="source-part"
    >
        <span class="source-icon" v-text="resolved.icon"></span>
        <span class="source-title">{{ resolved.displayTitle }}</span>
        <span class="source-arrow">\u2197</span>
    </a>
    <div v-else class="source-part">
        <span class="source-icon" v-text="resolved.icon"></span>
        <span class="source-title">{{ resolved.displayTitle }}</span>
    </div>
</template>
