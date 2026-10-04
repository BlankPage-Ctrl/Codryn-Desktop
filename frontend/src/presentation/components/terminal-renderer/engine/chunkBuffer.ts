import type { ShellExecLine } from '@/core/entities'

export interface BufferedLine {
    stream: 'stdout' | 'stderr'
    text: string
    at: number
}

/**
 * Chunks may be arbitrary splits (e.g. "hel" + "lo\nwor" + "ld\n").
 * This buffers and splits on newline while preserving stream coloring.
 * Each emitted line includes trailing newline handling without blank phantom.
 */
export function linesFromShellExecLines(lines: ShellExecLine[]): BufferedLine[] {
    // lines already preserve original chunk boundaries with `text` possibly multi-line
    // We expand multi-line chunks into per-visual-line entries.
    const out: BufferedLine[] = []
    for (const l of lines) {
        const parts = l.text.split('\n')
        for (let i = 0; i < parts.length; i++) {
            const isLast = i === parts.length - 1
            // If original ends with \n, split produces trailing '' - skip it
            if (isLast && parts[i] === '' && l.text.endsWith('\n')) continue
            // Preserve exact text segment; if not last, add newline logically via separate line
            out.push({ stream: l.stream, text: parts[i] ?? '', at: l.at })
        }
    }
    return out
}

export function linesFromPersisted(stdoutAnsi: string, stderrAnsi: string): BufferedLine[] {
    const out: BufferedLine[] = []
    function pushSplit(src: string, stream: 'stdout' | 'stderr') {
        if (!src) return
        const parts = src.split('\n')
        const ends = src.endsWith('\n')
        const limit = ends ? parts.length - 1 : parts.length
        for (let i = 0; i < limit; i++) out.push({ stream, text: parts[i] ?? '', at: 0 })
    }
    pushSplit(stdoutAnsi, 'stdout')
    pushSplit(stderrAnsi, 'stderr')
    return out
}
