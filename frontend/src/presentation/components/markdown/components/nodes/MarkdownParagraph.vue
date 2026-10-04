<script setup lang="ts">
import type { Paragraph } from 'mdast'
import MarkdownChildren from '../MarkdownChildren.vue'

defineProps<{ node: Paragraph }>()
</script>

<template>
    <p><MarkdownChildren :nodes="node.children" /></p>
</template>
