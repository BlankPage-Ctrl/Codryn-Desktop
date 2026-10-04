<script setup lang="ts">
import type { Heading } from 'mdast'
import { computed } from 'vue'
import MarkdownChildren from '../MarkdownChildren.vue'

const props = defineProps<{ node: Heading }>()

const tag = computed(() => `h${Math.min(Math.max(props.node.depth, 1), 6)}`)
</script>

<template>
    <component :is="tag"><MarkdownChildren :nodes="node.children" /></component>
</template>
