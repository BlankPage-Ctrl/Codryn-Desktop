<script setup lang="ts">
// import type { Component } from 'vue'
import type { BlockPartPreviewConfig } from '../types/schema'

defineProps<{
    config?: BlockPartPreviewConfig
}>()
</script>

<template>
    <component v-if="config?.component" :is="config.component" v-bind="config.props" />
    <slot v-else />
</template>
