<script setup lang="ts">
import type { ResolvedThemeSection } from '../types/resolved'

const props = defineProps<{
    resolved: ResolvedThemeSection
}>()

function isActive(activeThemeId: string | null, id: string): boolean {
    return activeThemeId === id
}

function handleThemeSetActive(id: string) {
    props.resolved.onSetActiveTheme?.(id)
}
</script>

<template>
    <div>
        <div class="theme-grid">
            <div
                v-for="t in resolved.themes"
                :key="t.id"
                class="theme-card"
                :class="{ active: isActive(resolved.activeThemeId, t.id) }"
                @click="handleThemeSetActive(t.id)"
            >
                <div class="theme-swatches">
                    <span
                        v-for="(color, ci) in t.swatches"
                        :key="ci"
                        class="theme-swatch"
                        :style="{ background: color }"
                    />
                </div>
                <div class="theme-card-body">
                    <span class="theme-name">{{ t.name }}</span>
                </div>
                <div class="theme-card-actions">
                    <span v-if="isActive(resolved.activeThemeId, t.id)" class="active-label"
                        >Active</span
                    >
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.theme-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 16px;
}

.theme-card {
    width: 160px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-secondary);
    padding: 12px;
    cursor: pointer;
    transition:
        border-color 150ms ease,
        box-shadow 150ms ease;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.theme-card:hover {
    border-color: var(--border-color);
}

.theme-card.active {
    border-color: var(--border-color);
    box-shadow: 0 0 0 1.5px var(--border-color);
}

.theme-swatches {
    display: flex;
    gap: 6px;
}

.theme-swatch {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
}

.theme-card-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.theme-name {
    font-size: var(--type-md);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
}

.theme-card-actions {
    display: flex;
    gap: 4px;
    align-items: center;
    padding-top: 8px;
    border-top: 1px solid var(--border-color);
}

.active-label {
    font-size: var(--type-2xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-success);
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--color-success);
}
</style>
