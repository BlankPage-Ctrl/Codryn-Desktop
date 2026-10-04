<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { resolveFileIconComponent } from '@/presentation/composables/useFileIcon'
import {
    getLanguageIcon,
    LANGUAGE_ICON_MAP,
    DEFAULT_LANGUAGE_ICON,
} from '@/presentation/composables/useLanguageIcon'
import { extname, basename } from '@/shared/utils/path.utils'

const props = defineProps<{
    path: string
    isDirectory: boolean
    isExpanded?: boolean
    isSymlink?: boolean
}>()

const deviconName = computed<string | null>(() => {
    if (props.isDirectory) return null

    const base = basename(props.path)
    const baseKey = base.toLowerCase()
    if (LANGUAGE_ICON_MAP[baseKey]) return LANGUAGE_ICON_MAP[baseKey]

    const ext = extname(props.path)
    const lang = ext ? ext.slice(1) : ''
    const icon = getLanguageIcon(lang || baseKey)
    if (icon !== DEFAULT_LANGUAGE_ICON) return icon

    // Fallback? try full basename as lang (e.g. "dockerfile" without ext already handled)
    return null
})

const fallbackComponent = computed(() => resolveFileIconComponent(props.path, props.isDirectory))
</script>

<template>
    <Icon
        v-if="deviconName"
        :icon="deviconName"
        class="fe-icon fe-icon--devicon"
        aria-hidden="true"
        width="16"
        height="16"
    />
    <component
        v-else
        :is="fallbackComponent"
        class="fe-icon fe-icon--fallback"
        aria-hidden="true"
        width="16"
        height="16"
    />
</template>

<style scoped>
.fe-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: var(--text-primary);
    opacity: 0.7;
}

.fe-icon--devicon {
    filter: grayscale(1);
}
</style>
