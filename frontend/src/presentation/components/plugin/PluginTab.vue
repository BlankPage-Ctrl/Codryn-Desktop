<script setup lang="ts">
import { computed } from 'vue'
import type { PluginTabSchema } from './types/schema'
import { resolvePluginTabSchema } from './resolver/resolvePluginTabSchema'
import BasePluginTab from './BasePluginTab.vue'

const props = defineProps<{
    schema: PluginTabSchema
}>()

const resolved = computed(() => resolvePluginTabSchema(props.schema))
</script>

<template>
    <BasePluginTab :resolved="resolved" />
</template>
