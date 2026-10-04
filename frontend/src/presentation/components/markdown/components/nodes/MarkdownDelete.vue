<script setup lang="ts">
import type { Delete } from 'mdast'
import MarkdownChildren from '../MarkdownChildren.vue'

defineProps<{ node: Delete }>()
</script>

<template>
    <del><MarkdownChildren :nodes="node.children" /></del>
</template>
