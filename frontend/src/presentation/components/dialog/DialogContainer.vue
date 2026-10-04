<script setup lang="ts">
import DialogGrid from './GridDialog.vue'
import { dialogs, submitDialog, cancelDialog } from '@/presentation/composables/useDialog'
</script>

<template>
    <DialogGrid
        v-for="d in dialogs"
        :key="d.id"
        v-model="d.visible"
        :title="d.options.title"
        :schema="d.options.schema"
        :initial-data="d.options.initialData"
        :confirm-label="d.options.confirmLabel"
        :cancel-label="d.options.cancelLabel"
        :width="d.options.width ?? 'md'"
        :dense="d.options.dense ?? true"
        :loading="d.loading"
        :confirm-variant="d.options.confirmVariant ?? 'primary'"
        :close-on-backdrop="d.options.closeOnBackdrop ?? true"
        @submit="submitDialog(d.id, $event)"
        @cancel="cancelDialog(d.id)"
    >
        <template v-if="d.options.message && !d.options.schema">
            <p class="dialog-message">{{ d.options.message }}</p>
        </template>
    </DialogGrid>
</template>

<style scoped>
.dialog-message {
    margin: 0;
    font-size: var(--type-md);
    line-height: 1.5;
    color: var(--text-primary);
    opacity: 0.8;
}
</style>
