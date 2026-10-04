<script setup lang="ts">
import type { List } from 'mdast'
import { computed } from 'vue'
import MarkdownChildren from '../MarkdownChildren.vue'

const props = defineProps<{ node: List }>()

const tag = computed(() => (props.node.ordered ? 'ol' : 'ul'))
</script>

<template>
    <component :is="tag" :start="node.ordered && node.start ? node.start : undefined">
        <MarkdownChildren :nodes="node.children" />
    </component>
</template>
