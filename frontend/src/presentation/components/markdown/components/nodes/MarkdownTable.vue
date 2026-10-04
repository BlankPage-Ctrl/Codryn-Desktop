<script setup lang="ts">
import type { Table } from 'mdast'
import MarkdownChildren from '../MarkdownChildren.vue'

defineProps<{ node: Table }>()
</script>

<template>
    <table class="markdown-table">
        <thead v-if="node.children[0]">
            <tr>
                <th
                    v-for="(cell, index) in node.children[0].children"
                    :key="index"
                    :align="node.align?.[index] ?? undefined"
                >
                    <MarkdownChildren :nodes="cell.children" />
                </th>
            </tr>
        </thead>
        <tbody v-if="node.children.length > 1">
            <MarkdownChildren :nodes="node.children.slice(1)" />
        </tbody>
    </table>
</template>
