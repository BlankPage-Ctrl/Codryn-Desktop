<script setup lang="ts">
import { computed } from 'vue'
import type { SettingsTabSchema } from './types/schema'
import { resolveSettingsTabSchema } from './resolver/resolveSettingsTabSchema'
import BaseSettingsTab from './BaseSettingsTab.vue'

const props = defineProps<{
    schema: SettingsTabSchema
}>()

const resolved = computed(() => resolveSettingsTabSchema(props.schema))
</script>

<template>
    <BaseSettingsTab :resolved="resolved" />
</template>
