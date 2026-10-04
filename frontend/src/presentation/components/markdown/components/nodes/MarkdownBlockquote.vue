<script setup lang="ts">
import type { Blockquote } from 'mdast'
import MarkdownChildren from '../MarkdownChildren.vue'

defineProps<{ node: Blockquote }>()
</script>

<template>
    <blockquote><MarkdownChildren :nodes="node.children" /></blockquote>
</template>
