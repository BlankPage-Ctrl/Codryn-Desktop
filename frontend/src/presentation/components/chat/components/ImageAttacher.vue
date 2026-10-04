<script setup lang="ts">
import { Xmark } from '@iconoir/vue'
import type { AttachedImage } from '../types/attachment'
import { formatBytes } from '../types/attachment'

defineProps<{
    images: AttachedImage[]
    onRemove?: (localId: string) => void
}>()
</script>

<template>
    <div v-if="images.length > 0" class="image-attacher">
        <div
            v-for="img in images"
            :key="img.localId"
            class="image-attacher__item"
            :title="img.filename + ' (' + formatBytes(img.sizeBytes) + ')'"
            :class="{
                'image-attacher__item--uploading': img.status === 'uploading',
                'image-attacher__item--error': img.status === 'error',
            }"
        >
            <img class="image-attacher__thumb" :src="img.previewUrl" :alt="img.filename" />
            <div v-if="img.status === 'uploading'" class="image-attacher__overlay">
                <span class="image-attacher__spinner" aria-label="Uploading"></span>
            </div>
            <div
                v-if="img.status === 'error'"
                class="image-attacher__error-dot"
                :title="img.error ?? 'Upload failed'"
                aria-label="Upload failed"
            ></div>
            <button
                v-if="onRemove"
                class="image-attacher__remove"
                type="button"
                title="Remove image"
                aria-label="Remove image"
                @click="onRemove(img.localId)"
            >
                <Xmark width="12" height="12" />
            </button>
        </div>
    </div>
</template>

<style scoped>
.image-attacher {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    margin-bottom: 6px;
    padding: 3px 3px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    scrollbar-width: thin;
}
.image-attacher__item {
    position: relative;
    flex: 0 0 auto;
    width: 52px;
    height: 52px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    overflow: hidden;
    background: var(--bg-primary);
}
.image-attacher__item--error {
    border-color: var(--color-danger);
}
.image-attacher__thumb {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.image-attacher__item--uploading .image-attacher__thumb {
    opacity: 0.5;
}
.image-attacher__overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}
.image-attacher__spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-color);
    border-top-color: var(--text-primary);
    border-radius: 50%;
    animation: image-attacher-spin 0.8s linear infinite;
}
@keyframes image-attacher-spin {
    to {
        transform: rotate(360deg);
    }
}
.image-attacher__error-dot {
    position: absolute;
    left: 4px;
    bottom: 4px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-danger);
}
.image-attacher__remove {
    position: absolute;
    top: 2px;
    right: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border: none;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    color: var(--text-primary);
    cursor: pointer;
}
</style>
