<script setup lang="ts">
import type { ResolvedAppearanceSection } from '../types/resolved'

const props = defineProps<{
    resolved: ResolvedAppearanceSection
}>()

function onPresetClick(label: string) {
    props.resolved.onUpdatePreset?.(label)
}

function onScaleInput(e: Event) {
    const value = Number((e.target as HTMLInputElement).value)
    props.resolved.onUpdateFontSize?.(value)
}
</script>

<template>
    <div class="appearance-card">
        <div class="appearance-row">
            <label class="appearance-label">Preset</label>
            <div class="preset-group">
                <button
                    v-for="p in resolved.presets"
                    :key="p.label"
                    class="preset-btn"
                    :class="{ active: resolved.preset === p.label }"
                    :aria-pressed="resolved.preset === p.label ? 'true' : 'false'"
                    @click="onPresetClick(p.label)"
                >
                    {{ p.label }}
                </button>
                <span class="preset-custom-tag" :class="{ active: resolved.preset === 'Custom' }"
                    >Custom</span
                >
            </div>
        </div>

        <div class="appearance-row">
            <label class="appearance-label">
                Scale
                <span class="scale-value">{{ resolved.fontSize }}px</span>
            </label>
            <input
                type="range"
                class="appearance-slider"
                min="12"
                max="20"
                step="1"
                :value="resolved.fontSize"
                @input="onScaleInput"
            />
        </div>
    </div>
</template>

<style scoped>
.appearance-card {
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-secondary);
    padding: 14px 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.appearance-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.appearance-label {
    font-size: var(--type-xs);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 6px;
}

.scale-value {
    font-family: var(--font-mono);
    font-size: var(--type-2xs);
    opacity: 0.5;
    font-weight: var(--font-weight-normal);
}

.preset-group {
    display: flex;
    gap: 4px;
    align-items: center;
    flex-wrap: wrap;
}

.preset-btn {
    font-size: var(--type-xs);
    font-weight: var(--font-weight-medium);
    padding: 4px 10px;
    border-radius: 4px;
    border: none;
    background: transparent;
    color: var(--text-primary);
    opacity: 0.5;
    cursor: pointer;
    transition:
        opacity 100ms ease,
        background 100ms ease;
}

.preset-btn:hover {
    opacity: 0.8;
}

.preset-btn.active,
.preset-btn[aria-pressed='true'] {
    opacity: 1;
    background: rgba(var(--raw-border-color), 0.3);
}

.preset-custom-tag {
    font-size: var(--type-2xs);
    font-weight: var(--font-weight-medium);
    padding: 2px 8px;
    border-radius: 9999px;
    background: var(--border-color);
    color: var(--text-primary);
    opacity: 0.35;
    transition: opacity 100ms ease;
}

.preset-custom-tag.active {
    opacity: 0.8;
    background: var(--border-color);
}

.appearance-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 3px;
    border-radius: 2px;
    background: var(--border-color);
    outline: none;
    cursor: pointer;
}

.appearance-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--border-color);
    cursor: pointer;
    border: 2px solid var(--bg-secondary);
    transition: transform 100ms ease;
}

.appearance-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
}

.appearance-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--border-color);
    cursor: pointer;
    border: 2px solid var(--bg-secondary);
}
</style>
