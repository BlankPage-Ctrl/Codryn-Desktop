<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { attachmentIdFromUrl } from '../types/attachment'

export interface UserImage {
    url?: string
    mediaType: string
    filename?: string
}

const props = defineProps<{
    images: UserImage[]
    /** Resolves an `attachment://<id>` ref to a renderable URL. Provided by the View. */
    resolveAttachmentUrl?: (attachmentId: string) => Promise<string | null>
}>()

const loadedUrls = ref<Record<number, string>>({})
const failed = ref<Record<number, boolean>>({})

function isDirect(url: string): boolean {
    return url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')
}

async function resolveImage(idx: number): Promise<void> {
    const img = props.images[idx]
    if (!img?.url || failed.value[idx] || loadedUrls.value[idx]) return
    if (isDirect(img.url)) {
        loadedUrls.value[idx] = img.url
        return
    }
    const id = attachmentIdFromUrl(img.url)
    if (id == null || !props.resolveAttachmentUrl) {
        if (id != null) failed.value[idx] = true
        return
    }
    try {
        const resolved = await props.resolveAttachmentUrl(id)
        if (resolved) loadedUrls.value[idx] = resolved
        else failed.value[idx] = true
    } catch {
        failed.value[idx] = true
    }
}

onMounted(() => {
    void Promise.all(props.images.map((_, idx) => resolveImage(idx)))
})

watch(
    () => props.images,
    () => {
        void Promise.all(props.images.map((_, idx) => resolveImage(idx)))
    },
)
</script>

<template>
    <div v-if="images.length > 0" class="user-image-grid">
        <figure v-for="(img, idx) in images" :key="idx" class="user-image-grid__item">
            <img
                v-if="loadedUrls[idx]"
                class="user-image-grid__thumb"
                :src="loadedUrls[idx]"
                :alt="img.filename ?? 'attached image'"
            />
            <div v-else-if="failed[idx]" class="user-image-grid__fallback">
                <span class="user-image-grid__icon">🖼️</span>
                <span class="user-image-grid__name">{{ img.filename ?? 'image' }}</span>
            </div>
            <div v-else class="user-image-grid__loading" aria-label="Loading image"></div>
        </figure>
    </div>
</template>

<style scoped>
.user-image-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
}
.user-image-grid__item {
    margin: 0;
    width: 120px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
    background: var(--bg-secondary);
}
.user-image-grid__thumb {
    display: block;
    width: 100%;
    height: 80px;
    object-fit: cover;
}
.user-image-grid__loading {
    width: 100%;
    height: 80px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
    background-size: 200% 100%;
    animation: user-image-shimmer 1.2s linear infinite;
}
@keyframes user-image-shimmer {
    to {
        background-position: -200% 0;
    }
}
.user-image-grid__fallback {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 8px;
    font-size: 11px;
}
.user-image-grid__name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}
</style>
