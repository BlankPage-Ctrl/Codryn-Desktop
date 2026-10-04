export interface ParsedLine {
    lineNumber: number
    text: string
}

const CAT_N_WIDTH = 6
const nativeRe = /^\s*(\d+)\t(.*)$/
const pipeRe = /^\s*(\d+)\s*\|\s*(.*)$/

function splitToRawLines(content: string): string[] {
    if (content === '') return []
    const raw = content.split('\n')
    if (content.endsWith('\n') && raw[raw.length - 1] === '') {
        raw.pop()
    }
    return raw
}

export function parseCodeLines(code: string): ParsedLine[] {
    if (code === '') return []
    const rawLines = splitToRawLines(code)
    const hasCatN = rawLines.some((l) => nativeRe.test(l) || pipeRe.test(l))

    if (!hasCatN) {
        return rawLines.map((text, idx) => ({ lineNumber: idx + 1, text }))
    }
    const out: ParsedLine[] = []
    for (let i = 0; i < rawLines.length; i++) {
        const raw = rawLines[i] ?? ''
        if (raw === '') {
            out.push({ lineNumber: i + 1, text: '' })
            continue
        }
        let m: RegExpMatchArray | null = raw.match(nativeRe)
        if (!m) m = raw.match(pipeRe)
        if (m) {
            out.push({ lineNumber: Number(m[1]), text: m[2] ?? '' })
        } else {
            // fallback sequential based on position (1-indexed)
            // To keep gutter consistent when mixed, use i+1
            out.push({ lineNumber: i + 1, text: raw })
        }
    }
    return out
}

export function getCodeForHighlight(code: string): string {
    return parseCodeLines(code)
        .map((p) => p.text)
        .join('\n')
}

export function getMaxLineNumberWidth(lines: ParsedLine[]): number {
    if (!lines.length) return 1
    return String(Math.max(...lines.map((l) => l.lineNumber))).length
}

export { CAT_N_WIDTH }
