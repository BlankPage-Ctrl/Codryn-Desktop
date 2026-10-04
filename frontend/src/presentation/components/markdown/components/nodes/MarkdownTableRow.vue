<script setup lang="ts">
import type { TableRow } from 'mdast'
import MarkdownChildren from '../MarkdownChildren.vue'

defineProps<{ node: TableRow }>()
</script>

<template>
    <tr>
        <MarkdownChildren :nodes="node.children" />
    </tr>
</template>
