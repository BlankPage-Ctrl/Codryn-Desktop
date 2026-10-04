<script setup lang="ts">
import { computed } from 'vue'
import type { Image } from 'mdast'

const props = defineProps<{ node: Image }>()

const alt = computed<string | undefined>(() => props.node.alt ?? undefined)
const title = computed<string | undefined>(() => props.node.title ?? undefined)
</script>

<template>
    <img :src="props.node.url" :alt="alt" :title="title" loading="lazy" />
</template>
