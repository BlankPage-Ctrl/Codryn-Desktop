<script setup lang="ts">
import { useFileExplorerStorer } from '@/application/stores'
import FileTreeItem from './FileTreeItem.vue'

const store = useFileExplorerStorer()

const emit = defineEmits<{
    toggle: [path: string]
    select: [path: string]
}>()
</script>

<template>
    <ul class="fe-tree" role="group">
        <FileTreeItem
            v-for="item in store.visibleList"
            :key="item.node.path"
            :item="item"
            @toggle="emit('toggle', $event)"
            @select="emit('select', $event)"
        />
        <li v-if="store.visibleList.length === 0" class="fe-tree__empty">No files</li>
    </ul>
</template>

<style scoped>
.fe-tree {
    list-style: none;
    margin: 0;
    padding: 4px 0;
}

.fe-tree__empty {
    padding: 8px 16px;
    font-size: var(--type-sm);
    color: var(--text-primary);
    opacity: 0.35;
}
</style>
