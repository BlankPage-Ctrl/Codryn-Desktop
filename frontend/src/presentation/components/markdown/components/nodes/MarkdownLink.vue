<script setup lang="ts">
import type { Link } from 'mdast'
import MarkdownChildren from '../MarkdownChildren.vue'

defineProps<{ node: Link }>()
</script>

<template>
    <a :href="node.url" :title="node.title || undefined" target="_blank" rel="noopener noreferrer">
        <MarkdownChildren :nodes="node.children" />
    </a>
</template>
