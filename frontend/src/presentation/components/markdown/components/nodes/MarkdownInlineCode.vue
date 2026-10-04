<script setup lang="ts">
import type { InlineCode } from 'mdast'

defineProps<{ node: InlineCode }>()
</script>

<template>
    <code class="markdown-inline-code">{{ node.value }}</code>
</template>
