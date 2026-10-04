<script setup lang="ts">
import type { Text } from 'mdast'

defineProps<{ node: Text & { loading?: boolean } }>()
</script>

<template>
    <span :class="{ 'markdown-loading': node.loading }">{{ node.value }}</span>
</template>
