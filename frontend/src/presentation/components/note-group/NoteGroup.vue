<script setup lang="ts">
import { AppList } from '@/presentation/components/list'
import type { ListSchema } from '@/presentation/components/list'
import type { Note } from '@/core/entities'

defineProps<{
    title: string
    schema: ListSchema<Note>
    notes: Note[]
}>()
</script>

<template>
    <div class="ng-root">
        <div class="ng-root__title">{{ title }}</div>
        <AppList
            :schema="schema as unknown as ListSchema<Record<string, unknown>>"
            :items="notes as unknown as Record<string, unknown>[]"
        />
    </div>
</template>

<style scoped>
.ng-root {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.ng-root__title {
    padding: 8px 10px 4px;
    font-size: var(--type-2xs);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-primary);
    opacity: 0.4;
}
</style>
