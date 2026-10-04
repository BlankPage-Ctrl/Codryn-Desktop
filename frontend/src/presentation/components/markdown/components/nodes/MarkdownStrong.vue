<script setup lang="ts">
import type { Strong } from 'mdast'
import MarkdownChildren from '../MarkdownChildren.vue'

defineProps<{ node: Strong }>()
</script>

<template>
    <strong><MarkdownChildren :nodes="node.children" /></strong>
</template>
