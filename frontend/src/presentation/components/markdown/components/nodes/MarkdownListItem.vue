<script setup lang="ts">
import type { ListItem } from 'mdast'
import MarkdownChildren from '../MarkdownChildren.vue'

defineProps<{ node: ListItem }>()
</script>

<template>
    <li>
        <label v-if="typeof node.checked === 'boolean'" class="markdown-task">
            <input type="checkbox" :checked="node.checked" disabled />
            <MarkdownChildren :nodes="node.children" />
        </label>
        <MarkdownChildren v-else :nodes="node.children" />
    </li>
</template>
