<script setup lang="ts">
import type { RenderChunk } from '../types'
import MarkdownRawText from './nodes/MarkdownRawText.vue'

defineProps<{ chunk: RenderChunk }>()
</script>

<template>
    <template v-for="item in chunk.items" :key="item.key">
        <component :is="item.renderer ?? MarkdownRawText" :node="item.node" />
    </template>
</template>
