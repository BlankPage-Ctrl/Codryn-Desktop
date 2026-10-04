<script setup lang="ts">
import { computed, ref, watch, nextTick, inject, type Ref } from 'vue'
import type { TerminalRendererSchema } from './types/schema'
import { resolveTerminalRendererSchema } from './resolver/resolveTerminalRendererSchema'
import { useTerminalRenderer } from './composables/useTerminalRenderer'
import { useTerminalScroll } from './composables/useTerminalScroll'
import TerminalHeader from './components/TerminalHeader.vue'
import './styles/index.css'

defineOptions({ name: 'TerminalRenderer' })

const props = defineProps<{ schema: TerminalRendererSchema }>()

const resolved = computed(() => resolveTerminalRendererSchema(props.schema))

// Lazy until BlockPart expanded (if inside BlockPart). Fallback to true when not in BlockPart.
const blockExpanded = inject<Ref<boolean> | null>('blockpart-expanded', null)
const shouldRenderBody = computed(() => (blockExpanded ? blockExpanded.value : true))

const { lines } = useTerminalRenderer(
    computed(() =>
        shouldRenderBody.value
            ? resolved.value
            : {
                  ...resolved.value,
                  lines: [],
                  stdout: '',
                  stderr: '',
                  stdoutAnsi: '',
                  stderrAnsi: '',
              },
    ),
)

const bodyRef = ref<HTMLElement | null>(null)
const { onScroll, bindLengthWatcher, scrollToBottom } = useTerminalScroll(() => bodyRef.value)

bindLengthWatcher(() => lines.value.length)

watch(
    () => resolved.value.status,
    () => nextTick(() => scrollToBottom()),
)

watch(shouldRenderBody, (v) => {
    if (v) nextTick(() => scrollToBottom())
})
</script>

<template>
    <div
        class="terminal-renderer"
        :class="{
            'terminal-renderer--plain': !resolved.animated,
            'terminal-renderer--animated': resolved.animated,
        }"
        :data-status="resolved.status"
        :data-animated="resolved.animated ? '1' : '0'"
    >
        <TerminalHeader
            :command="resolved.command"
            :truncated="resolved.truncated"
            :spill-path="resolved.spillPath"
        />

        <div v-if="!shouldRenderBody" class="terminal-renderer__lazy">
            Preview hidden — expand to render
        </div>
        <pre
            v-else
            ref="bodyRef"
            class="terminal-renderer__body"
            @scroll="onScroll"
        ><template v-if="lines.length === 0"><span class="terminal-renderer__empty">(no output)</span></template><template v-else><span
                v-for="line in lines"
                :key="line.key"
                class="terminal-renderer__line"
                :class="line.stream === 'stderr' ? 'terminal-renderer__line--stderr' : 'terminal-renderer__line--stdout'"
            ><template v-if="resolved.animated"><span
                    v-for="(sp, i) in line.spans"
                    :key="i"
                    class="terminal-renderer__ansi"
                    :style="{
                        color: sp.color || undefined,
                        backgroundColor: sp.bgColor || undefined,
                        fontWeight: sp.bold ? '700' : undefined,
                        opacity: sp.dim ? '0.7' : undefined,
                        fontStyle: sp.italic ? 'italic' : undefined,
                        textDecoration: sp.underline ? 'underline' : undefined,
                    }"
                >{{ sp.text }}</span><template v-if="line.plain === ''">&#8203;</template></template><template v-else>{{ line.plain }}<template v-if="line.plain === ''">&#8203;</template></template></span></template></pre>
    </div>
</template>
