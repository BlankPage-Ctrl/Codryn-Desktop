<script setup lang="ts">
import { computed } from 'vue'
import type { MarkdownSchema } from './types'
import { resolveMarkdownSchema } from './resolver/resolveMarkdownSchema'
import { useMarkdownRender } from './composables/useMarkdownRender'
import { provideMarkdownContext } from './composables/markdown-context'
import MarkdownBlock from './components/MarkdownBlock.vue'
import './styles/index.css'

const props = defineProps<{ schema: MarkdownSchema }>()

const resolved = computed(() => resolveMarkdownSchema(props.schema))

const { chunks, hasLoading } = useMarkdownRender(resolved)

provideMarkdownContext({
    isDark: computed(() => resolved.value.isDark),
    fontSize: computed(() => resolved.value.fontSize),
    lineHeight: computed(() => resolved.value.lineHeight),
    codeTheme: computed(() => resolved.value.code.theme),
    registry: computed(() => resolved.value.renderers),
})

const rootStyle = computed(() => ({
    fontSize: `${resolved.value.fontSize}px`,
    lineHeight: resolved.value.lineHeight,
}))
</script>

<template>
    <div
        class="markdown"
        :class="{ 'markdown--dark': resolved.isDark, 'markdown--loading': hasLoading }"
        :style="rootStyle"
    >
        <MarkdownBlock v-for="chunk in chunks" :key="chunk.key" :chunk="chunk" />
    </div>
</template>
