<script setup lang="ts">
import type { ParsedNode } from '../types'
import { injectMarkdownContext } from '../composables/markdown-context'
import { makeNodeKey } from '../engine/keys'
import MarkdownRawText from './nodes/MarkdownRawText.vue'

defineProps<{ nodes: ParsedNode[] }>()

const ctx = injectMarkdownContext()
</script>

<template>
    <template v-for="(node, index) in nodes" :key="makeNodeKey(node, index)">
        <component :is="ctx.registry.value[node.type] ?? MarkdownRawText" :node="node" />
    </template>
</template>
