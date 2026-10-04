<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStorer } from '@/application/stores'
import { Markdown, type MarkdownSchema } from '@/presentation/components/markdown'
import type { TextPartSchema } from '../../types/schema'
import { resolveTextPartSchema } from '../../resolver/resolvePartsSchema'

const props = defineProps<{
    schema: TextPartSchema
}>()

const themeStorer = useThemeStorer()

const resolved = computed(() => resolveTextPartSchema(props.schema))
const isDark = computed(() => themeStorer.activeThemeId === 'night')

const markdownSchema = computed<MarkdownSchema>(() => ({
    text: resolved.value.text,
    state: resolved.value.state === 'streaming' ? 'streaming' : 'done',
    isDark: isDark.value,
    fontSize: resolved.value.fontSize,
    lineHeight: resolved.value.lineHeight,
}))
</script>

<template>
    <div
        class="text-part"
        :style="{
            fontSize: resolved.fontSize + 'px',
            lineHeight: resolved.lineHeight,
        }"
    >
        <Markdown :schema="markdownSchema" />
    </div>
</template>
