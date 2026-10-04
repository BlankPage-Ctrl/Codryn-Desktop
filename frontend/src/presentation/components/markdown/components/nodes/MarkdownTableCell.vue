<script setup lang="ts">
import type { TableCell } from 'mdast'
import MarkdownChildren from '../MarkdownChildren.vue'

defineProps<{ node: TableCell }>()
</script>

<template>
    <td><MarkdownChildren :nodes="node.children" /></td>
</template>
