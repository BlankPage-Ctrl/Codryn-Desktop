<script setup lang="ts">
import { Plus } from '@iconoir/vue'
import { pButton } from '@/presentation/components/button'
import CategoryRow from './CategoryRow.vue'
import type { ResolvedCategoriesTab } from '../../types/resolved'
import type { Category } from '@/core/entities'

defineProps<{
    resolved: ResolvedCategoriesTab
}>()

const emit = defineEmits<{
    create: []
    rename: [category: Category]
    delete: [category: Category]
}>()
</script>

<template>
    <div class="categories-tab">
        <div class="categories-tab__head">
            <h2 class="categories-tab__title">Categories</h2>
            <pButton
                :schema="{
                    label: 'New category',
                    icon: Plus,
                    iconPosition: 'left',
                    size: 'sm',
                    radius: 'sm',
                    preset: 'secondary',
                    overrides: { size: 'sm', radius: 'sm' },
                }"
                @click="emit('create')"
            />
        </div>

        <p class="categories-tab__hint">
            Group your notes by category. New notes without a category go to the default one.
        </p>

        <div v-if="resolved.error" class="categories-tab__error">{{ resolved.error }}</div>

        <div v-if="!resolved.rows.length" class="categories-tab__empty">
            No categories yet. Create your first one.
        </div>

        <div v-else class="categories-tab__list">
            <CategoryRow
                v-for="row in resolved.rows"
                :key="row.category.id"
                :row="row"
                @rename="emit('rename', $event)"
                @delete="emit('delete', $event)"
            />
        </div>
    </div>
</template>

<style src="./styles.css"></style>
