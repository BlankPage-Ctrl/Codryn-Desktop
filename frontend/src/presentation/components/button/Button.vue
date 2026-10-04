<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonSchema } from './types/schema.ts'

defineOptions({ name: 'AppButton' })
import { resolveButtonSchema } from './resolver/resolveSchema.ts'
import BaseButton from './BaseButton.vue'

const props = defineProps<{ schema: ButtonSchema }>()
const emit = defineEmits<{ click: [e: MouseEvent] }>()

const resolved = computed(() => resolveButtonSchema(props.schema))
</script>

<template>
    <BaseButton :resolved="resolved" @click="emit('click', $event)" />
</template>
