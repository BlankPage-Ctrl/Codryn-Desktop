<script setup lang="ts">
import { pButton } from '@/presentation/components/button'
import { EditActionIcon, TrashActionIcon } from '@/presentation/schemas/common/icons.schema'
import type { Category } from '@/core/entities'
import type { ResolvedCategoryRow } from '../../types/resolved'

defineProps<{
    row: ResolvedCategoryRow
}>()

const emit = defineEmits<{
    rename: [category: Category]
    delete: [category: Category]
}>()

function noteLabel(count: number): string {
    return count === 1 ? '1 note' : `${count} notes`
}
</script>

<template>
    <div class="category-row">
        <div class="category-row__body">
            <span class="category-row__name" :title="row.category.name">
                {{ row.category.name }}
            </span>
            <span class="category-row__meta">
                <span v-if="row.category.is_default" class="category-row__badge">Default</span>
                <span>{{ noteLabel(row.noteCount) }}</span>
            </span>
        </div>

        <div v-if="!row.category.is_default" class="category-row__actions" @click.stop>
            <pButton
                :schema="{
                    variant: 'ghost',
                    size: 'xs',
                    icon: EditActionIcon,
                    iconPosition: 'only',
                    ariaLabel: `Rename ${row.category.name}`,
                }"
                @click="emit('rename', row.category)"
            />
            <pButton
                :schema="{
                    variant: 'ghost',
                    size: 'xs',
                    icon: TrashActionIcon,
                    iconPosition: 'only',
                    ariaLabel: `Delete ${row.category.name}`,
                    preset: 'danger',
                    overrides: { variant: 'ghost', iconPosition: 'only' },
                }"
                @click="emit('delete', row.category)"
            />
        </div>
    </div>
</template>

<style scoped>
.category-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    transition: background-color 80ms ease;
}

.category-row:hover {
    background: rgba(var(--raw-border-color), 0.18);
}

.category-row__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.category-row__name {
    font-family: var(--font-serif);
    font-size: var(--type-sm);
    color: var(--text-primary);
    opacity: 0.85;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.category-row__meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--type-2xs);
    color: var(--text-primary);
    opacity: 0.5;
}

.category-row__badge {
    padding: 0 5px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: var(--type-2xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.category-row__actions {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 100ms ease;
}

.category-row:hover .category-row__actions,
.category-row:focus-within .category-row__actions {
    opacity: 1;
}
</style>
