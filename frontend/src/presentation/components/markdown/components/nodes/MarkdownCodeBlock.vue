<script setup lang="ts">
import type { Code } from 'mdast'
import { computed, ref, defineComponent, h } from 'vue'
import { Copy } from '@iconoir/vue'
import { Icon } from '@iconify/vue'
import { injectMarkdownContext } from '../../composables/markdown-context'
import { CodeRenderer } from '@/presentation/components/code-renderer'
import { BlockPart } from '@/presentation/components/blockpart'
import type { BlockPartSchema, BlockPartAction } from '@/presentation/components/blockpart'
import { getLanguageIcon } from '@/presentation/composables/useLanguageIcon'

const props = defineProps<{ node: Code & { loading?: boolean } }>()

const ctx = injectMarkdownContext()

const lang = computed(() => props.node.lang || 'text')
const displayTitle = computed(() => {
    const v = lang.value.trim()
    if (!v) return 'Text'
    return v.charAt(0).toUpperCase() + v.slice(1)
})
const code = computed(() => props.node.value)
const status = computed(() => (props.node.loading ? 'streaming' : 'done'))

const codeRendererSchema = computed(() => ({
    code: code.value,
    lang: lang.value,
    status: status.value as 'streaming' | 'done',
    isDark: ctx.isDark.value,
    theme: ctx.codeTheme.value,
}))

const codeRef = ref<InstanceType<typeof CodeRenderer> | null>(null)
const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined

function setCopiedTooltip() {
    copied.value = true
    if (resetTimer) clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
        copied.value = false
    }, 1500)
}

async function handleCopy() {
    let ok = false
    try {
        if (codeRef.value?.copy) {
            ok = await codeRef.value.copy()
        } else {
            await navigator.clipboard.writeText(code.value)
            ok = true
        }
    } catch {
        ok = false
    }
    if (!ok && code.value) {
        try {
            await navigator.clipboard.writeText(code.value)
            ok = true
        } catch {
            ok = false
        }
    }
    if (ok) setCopiedTooltip()
}

const copyAction = computed<BlockPartAction>(() => ({
    id: 'copy',
    icon: Copy,
    ariaLabel: 'Copy code',
    tooltip: copied.value ? 'Copied!' : 'Copy',
    disabled: !code.value,
    onClick: handleCopy,
}))

const langIconName = computed(() => getLanguageIcon(lang.value))

const langIconComponent = computed(() =>
    defineComponent({
        name: 'LangIcon',
        props: {
            width: { type: [String, Number], default: '14.8' },
            height: { type: [String, Number], default: '14.8' },
        },
        setup(props) {
            return () =>
                h(Icon, {
                    icon: langIconName.value,
                    width: props.width,
                    height: props.height,
                    style: 'filter:grayscale(1)',
                })
        },
    }),
)

const blockSchema = computed<BlockPartSchema>(() => ({
    title: displayTitle.value,
    variant: 'default',
    icon: langIconComponent.value,
    defaultExpanded: true,
    collapsible: true,
    viewToggle: true,
    defaultView: 'preview',
    status: status.value,
    actions: [copyAction.value],
}))
</script>

<template>
    <BlockPart :schema="blockSchema" class="markdown-code">
        <template #preview>
            <CodeRenderer
                ref="codeRef"
                :schema="codeRendererSchema"
                class="markdown-code__renderer"
            />
        </template>
    </BlockPart>
</template>

<style scoped>
.markdown-code :deep(.block-icon) {
    filter: grayscale(1);
}
</style>
