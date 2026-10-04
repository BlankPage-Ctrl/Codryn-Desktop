<script setup lang="ts">
import { computed } from 'vue'
import type { FilePartSchema } from '../../types/schema'
import { resolveFilePartSchema } from '../../resolver/resolvePartsSchema'

const props = defineProps<{
    schema: FilePartSchema
}>()

const resolved = computed(() => resolveFilePartSchema(props.schema))
</script>

<template>
    <a
        v-if="resolved.isLink"
        :href="resolved.url"
        target="_blank"
        rel="noopener noreferrer"
        class="file-part"
    >
        <span class="file-icon" v-text="resolved.icon"></span>
        <span class="file-name">{{ resolved.displayName }}</span>
        <span class="file-type">{{ resolved.typeLabel }}</span>
        <span class="file-arrow">\u2197</span>
    </a>
    <div v-else class="file-part">
        <span class="file-icon" v-text="resolved.icon"></span>
        <span class="file-name">{{ resolved.displayName }}</span>
        <span class="file-type">{{ resolved.typeLabel }}</span>
    </div>
</template>
