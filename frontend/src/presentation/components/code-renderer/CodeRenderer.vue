<script setup lang="ts">
import { computed } from 'vue'
import type { CodeRendererSchema } from './types/schema'
import { resolveCodeRendererSchema } from './resolver/resolveCodeRendererSchema'
import { useCodeRenderer } from './composables/useCodeRenderer'
import { useDiffRenderer } from './composables/useDiffRenderer'
import { parseCodeLines } from './utils/parseLineNumbers'
import { parseUnifiedDiff } from './utils/parseDiff'
import CodeTokens from './components/CodeTokens.vue'
import './styles/index.css'
import './styles/diff.css'

defineOptions({ name: 'CodeRenderer' })

const props = defineProps<{ schema: CodeRendererSchema }>()

const resolved = computed(() => resolveCodeRendererSchema(props.schema))

const isDiff = computed(() => resolved.value.variant === 'diff')

const parsedLines = computed(() => parseCodeLines(resolved.value.code))

const lineNumbers = computed(() => parsedLines.value.map((p) => p.lineNumber))

const codeForHighlight = computed(() => parsedLines.value.map((p) => p.text).join('\n'))

const highlightResolved = computed(() => ({
    ...resolved.value,
    code: codeForHighlight.value,
}))

const { tokens, isHighlighted, copy } = useCodeRenderer(highlightResolved)

const diffLines = computed(() => (isDiff.value ? parseUnifiedDiff(resolved.value.code) : []))

const { diffTokens, isDiffHighlighted } = useDiffRenderer(resolved, diffLines)

defineExpose({ copy })
</script>

<template>
    <pre
        class="code-renderer"
        :class="{
            'code-renderer--idle': resolved.status === 'idle',
            'code-renderer--streaming': resolved.status === 'streaming',
            'code-renderer--done': resolved.status === 'done',
            'code-renderer--highlighted': isHighlighted || isDiffHighlighted,
            'code-renderer--diff': isDiff,
        }"
        :data-lang="resolved.lang"
        :data-status="resolved.status"
        :data-variant="resolved.variant"
    ><code v-if="isDiff" class="code-renderer__inner code-renderer__inner--diff"><template v-if="diffLines.length === 0"><span class="code-renderer__line code-renderer__plain"><span class="code-renderer__gutter">1</span><span class="code-renderer__content">&#8203;</span></span></template><template v-else><span
                v-for="(dl, idx) in diffLines"
                :key="idx"
                class="code-renderer__line"
                :class="{
                    'code-renderer__line--add': dl.kind === 'add',
                    'code-renderer__line--del': dl.kind === 'del',
                    'code-renderer__line--hunk': dl.kind === 'hunk',
                    'code-renderer__line--context': dl.kind === 'context',
                    'code-renderer__line--truncated': dl.kind === 'truncated',
                }"
                ><span class="code-renderer__gutter code-renderer__gutter--diff">{{ dl.kind === 'hunk' ? '@@' : dl.kind === 'truncated' ? '…' : dl.prefix }}<template v-if="dl.kind !== 'hunk' && dl.kind !== 'truncated'">&#8203;</template></span><span class="code-renderer__content"><template v-if="dl.kind === 'hunk' || dl.kind === 'truncated'">{{ dl.text || dl.raw }}<template v-if="!dl.text && !dl.raw">&#8203;</template></template><template v-else-if="isDiffHighlighted && diffTokens[idx] && diffTokens[idx]!.length"><span
                        v-for="(tok, ti) in diffTokens[idx]"
                        :key="ti"
                        :style="tok.color ? { color: tok.color } : undefined"
                        >{{ tok.content }}</span
                    ><template v-if="dl.text === ''">&#8203;</template></template><template v-else>{{ dl.text }}<template v-if="!dl.text">&#8203;</template></template></span></span></template></code><code v-else class="code-renderer__inner"><CodeTokens
            v-if="isHighlighted && tokens.length"
            :lines="tokens"
            :line-numbers="lineNumbers"
        /><template v-else
            ><span
                v-for="(line, idx) in parsedLines"
                :key="idx"
                class="code-renderer__line code-renderer__plain"
                ><span class="code-renderer__gutter">{{ line.lineNumber }}</span
                ><span class="code-renderer__content">{{ line.text }}<template v-if="!line.text">&#8203;</template></span></span
            ><span v-if="parsedLines.length === 0" class="code-renderer__line code-renderer__plain"
                ><span class="code-renderer__gutter">1</span
                ><span class="code-renderer__content">&#8203;</span></span></template></code></pre>
</template>
