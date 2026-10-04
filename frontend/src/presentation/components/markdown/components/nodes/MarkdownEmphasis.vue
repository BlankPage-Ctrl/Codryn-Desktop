<script setup lang="ts">
import type { Emphasis } from 'mdast'
import MarkdownChildren from '../MarkdownChildren.vue'

defineProps<{ node: Emphasis }>()
</script>

<template>
    <em><MarkdownChildren :nodes="node.children" /></em>
</template>
