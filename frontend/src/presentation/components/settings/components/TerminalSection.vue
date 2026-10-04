<script setup lang="ts">
import type { ResolvedTerminalSection } from '../types/resolved'

const props = defineProps<{ resolved: ResolvedTerminalSection }>()

function onToggle(e: Event) {
    const v = (e.target as HTMLInputElement).checked
    props.resolved.onToggle?.(v)
}
</script>

<template>
    <div class="terminal-card">
        <div class="terminal-row">
            <div class="terminal-label">
                <span class="terminal-label__title">Animated Terminal Output</span>
                <span class="terminal-label__desc"
                    >Colored ANSI (full art). Disable for plain monochrome, lightweight.</span
                >
            </div>
            <label class="terminal-toggle">
                <input type="checkbox" :checked="resolved.animated" @change="onToggle" />
                <span class="terminal-toggle__slider"></span>
            </label>
        </div>
    </div>
</template>

<style scoped>
.terminal-card {
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-secondary);
    padding: 14px 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.terminal-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}
.terminal-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.terminal-label__title {
    font-size: var(--type-xs);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
}
.terminal-label__desc {
    font-size: var(--type-2xs);
    opacity: 0.6;
    color: var(--text-primary);
    line-height: 1.4;
}
.terminal-toggle {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
    flex-shrink: 0;
    cursor: pointer;
}
.terminal-toggle input {
    opacity: 0;
    width: 0;
    height: 0;
}
.terminal-toggle__slider {
    position: absolute;
    inset: 0;
    background: var(--border-color);
    border-radius: 9999px;
    transition: background 150ms ease;
}
.terminal-toggle__slider::before {
    content: '';
    position: absolute;
    height: 18px;
    width: 18px;
    left: 3px;
    top: 3px;
    background: var(--bg-primary, #fff);
    border-radius: 50%;
    transition: transform 150ms ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.terminal-toggle input:checked + .terminal-toggle__slider {
    background: var(--accent, #8250df);
}
.terminal-toggle input:checked + .terminal-toggle__slider::before {
    transform: translateX(20px);
}
</style>
