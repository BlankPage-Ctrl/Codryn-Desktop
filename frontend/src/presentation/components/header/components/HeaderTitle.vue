<script setup lang="ts">
defineProps<{
    title: string
    subtitle?: string
}>()
</script>

<template>
    <div class="header-text">
        <h2 class="header-title">{{ title }}</h2>
        <span v-if="subtitle" class="header-subtitle">{{ subtitle }}</span>
    </div>
</template>

<style scoped>
.header-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.header-title {
    font-family: var(--font-serif);
    font-size: var(--type-lg);
    font-weight: var(--font-weight-semibold);
    letter-spacing: -0.01em;
    color: var(--text-primary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.header-subtitle {
    font-size: var(--type-xs);
    color: var(--text-primary);
    opacity: 0.45;
}
</style>
