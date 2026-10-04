<script setup lang="ts">
import { computed } from 'vue'
import type { TabStripSchema } from './types/schema'
import TabStripItem from './components/TabStripItem.vue'

defineOptions({ name: 'TabStrip' })

const props = defineProps<{
    schema: TabStripSchema
}>()

const rootClass = computed(() => ['tabs-root', props.schema.class ?? ''].filter(Boolean).join(' '))
</script>

<style src="./styles/index.css"></style>

<template>
    <div :class="rootClass" role="tablist" aria-label="Open tabs">
        <TabStripItem
            v-for="tab in schema.tabs"
            :key="tab.id"
            :item="tab"
            :active="schema.activeId === tab.id"
            :closable="schema.closable"
            :on-select="() => schema.onSelect?.(tab.id)"
            :on-close="() => schema.onClose?.(tab.id)"
        />
    </div>
</template>
