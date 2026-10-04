<script setup lang="ts">
import type { ParsedNode } from '../../types'

defineProps<{ node: ParsedNode }>()
</script>

<template>
    <span>{{ 'value' in node ? String(node.value) : '' }}</span>
</template>
