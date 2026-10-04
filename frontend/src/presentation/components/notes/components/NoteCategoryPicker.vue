<script setup lang="ts">
import { computed } from 'vue'
import type { Category } from '@/core/entities'

const props = defineProps<{
    value: string
    categories: Category[]
}>()

const emit = defineEmits<{
    change: [categoryId: string]
}>()

const selected = computed({
    get: () => props.value,
    set: (v: string) => emit('change', v),
})
</script>

<template>
    <div class="note-category">
        <span class="note-category__label">Category</span>
        <div class="note-category__ctrl">
            <select v-model="selected" class="note-category__select">
                <option v-for="c in categories" :key="c.id" :value="c.id">
                    {{ c.name }}
                </option>
            </select>
        </div>
    </div>
</template>
