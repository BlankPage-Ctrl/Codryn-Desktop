import { computed, type ComputedRef } from 'vue'
import type { ResolvedTerminalRendererSchema } from '../types/schema'
import { parseAnsiToSpans, stripAnsi } from '../engine/ansi'
import { linesFromPersisted, linesFromShellExecLines } from '../engine/chunkBuffer'
import type { AnsiSpan } from '../engine/ansi'

export interface TerminalLineVM {
    key: string
    stream: 'stdout' | 'stderr'
    raw: string
    // spans when animated, plain text when !animated
    spans: AnsiSpan[]
    plain: string
}

export function useTerminalRenderer(resolved: ComputedRef<ResolvedTerminalRendererSchema>) {
    const hasLive = computed(() => resolved.value.lines.length > 0)

    const buffered = computed(() => {
        if (hasLive.value) return linesFromShellExecLines(resolved.value.lines)
        return linesFromPersisted(resolved.value.stdoutAnsi, resolved.value.stderrAnsi)
    })

    const lines = computed<TerminalLineVM[]>(() => {
        const animated = resolved.value.animated
        return buffered.value.map((b, idx) => {
            if (animated) {
                const spans = parseAnsiToSpans(b.text)
                const plain = stripAnsi(b.text)
                return {
                    key: `${b.stream}:${b.at}:${idx}`,
                    stream: b.stream,
                    raw: b.text,
                    spans,
                    plain,
                }
            }
            // plain: single span stripped
            const plain = stripAnsi(b.text)
            return {
                key: `${b.stream}:${b.at}:${idx}`,
                stream: b.stream,
                raw: b.text,
                spans: plain ? [{ text: plain }] : [{ text: '' }],
                plain,
            }
        })
    })

    const isEmpty = computed(() => lines.value.length === 0)

    return { lines, isEmpty, hasLive }
}
