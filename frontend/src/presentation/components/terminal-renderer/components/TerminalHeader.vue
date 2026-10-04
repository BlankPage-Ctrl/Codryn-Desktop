<script setup lang="ts">
defineProps<{
    command: string
    truncated: boolean
    spillPath: string | null
}>()
</script>

<template>
    <div class="terminal-prompt">
        <span class="terminal-prompt__dollar"
            >$ <span class="terminal-prompt__cmd">{{ command }}</span></span
        >
        <span v-if="truncated" class="terminal-prompt__trunc" :title="spillPath ?? ''">
            — truncated<span v-if="spillPath"> · {{ spillPath }}</span></span
        >
    </div>
</template>

<style scoped>
.terminal-prompt {
    padding: 6px 10px 0 10px;
    font-family: var(--font-mono);
    font-size: var(--type-sm);
    line-height: 1.5;
    display: flex;
    gap: 6px;
    border-bottom: 0.5px solid var(--border-color);
    align-items: baseline;
    flex-wrap: wrap;
    word-break: break-all;
}
.terminal-prompt__dollar {
    color: var(--color-success);
    font-weight: 700;
    user-select: none;
}
.terminal-prompt__cmd {
    color: var(--text-primary);
}
.terminal-prompt__trunc {
    opacity: 0.6;
    font-size: var(--type-xs);
}
</style>
