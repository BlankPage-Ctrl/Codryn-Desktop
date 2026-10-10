<script setup lang="ts">
import { computed } from 'vue'
import type { CategoriesTabSchema } from '../../types/schema'
import { resolveCategoriesTabSchema } from '../../resolver/resolveCategoriesTabSchema'
import BaseCategoriesTab from './BaseCategoriesTab.vue'
import type { Category } from '@/core/entities'

const props = defineProps<{
    schema: CategoriesTabSchema
}>()

const emit = defineEmits<{
    create: []
    rename: [category: Category]
    delete: [category: Category]
}>()

const resolved = computed(() => resolveCategoriesTabSchema(props.schema))
</script>

<template>
    <BaseCategoriesTab
        :resolved="resolved"
        @create="emit('create')"
        @rename="emit('rename', $event)"
        @delete="emit('delete', $event)"
    />
</template>
