/**Lightweight ANSI SGR parser - no external dep.
 * Supports 0 reset, 1 bold, 2 dim, 3 italic, 4 underline, 30-37, 90-97, 40-47, 100-107, 39,49.
 * Returns spans with inline style.
 */

export interface AnsiSpan {
    text: string
    color?: string
    bgColor?: string
    bold?: boolean
    dim?: boolean
    italic?: boolean
    underline?: boolean
}

const FG: Record<string, string> = {
    '30': '#000000',
    '31': '#e06c75',
    '32': '#98c379',
    '33': '#e5c07b',
    '34': '#61afef',
    '35': '#c678dd',
    '36': '#56b6c2',
    '37': '#abb2bf',
    '90': '#5c6370',
    '91': '#ff8a8a',
    '92': '#b5e48c',
    '93': '#ffcb6b',
    '94': '#82aaff',
    '95': '#ff9cac',
    '96': '#89ddff',
    '97': '#ffffff',
}

const BG: Record<string, string> = {
    '40': '#000000',
    '41': '#e06c75',
    '42': '#98c379',
    '43': '#e5c07b',
    '44': '#61afef',
    '45': '#c678dd',
    '46': '#56b6c2',
    '47': '#abb2bf',
    '100': '#5c6370',
    '101': '#ff8a8a',
    '102': '#b5e48c',
    '103': '#ffcb6b',
    '104': '#82aaff',
    '105': '#ff9cac',
    '106': '#89ddff',
    '107': '#ffffff',
}

const ANSI_RE = /\[([0-9;]*)m/g

export function parseAnsiToSpans(input: string): AnsiSpan[] {
    const spans: AnsiSpan[] = []
    let state: Omit<AnsiSpan, 'text'> = {}
    let lastIdx = 0
    let m: RegExpExecArray | null
    // reset lastIndex
    ANSI_RE.lastIndex = 0
    while ((m = ANSI_RE.exec(input)) !== null) {
        const idx = m.index
        if (idx > lastIdx) {
            const text = input.slice(lastIdx, idx)
            if (text) spans.push({ text, ...state })
        }
        const codes = (m[1] ?? '').split(';').filter(Boolean)
        if (codes.length === 0) {
            // \x1b[m === reset
            state = {}
        } else {
            for (const c of codes) {
                if (c === '0') state = {}
                else if (c === '1') state.bold = true
                else if (c === '2') state.dim = true
                else if (c === '3') state.italic = true
                else if (c === '4') state.underline = true
                else if (c === '22') {
                    state.bold = undefined
                    state.dim = undefined
                } else if (c === '23') state.italic = undefined
                else if (c === '24') state.underline = undefined
                else if (FG[c]) state.color = FG[c]
                else if (BG[c]) state.bgColor = BG[c]
                else if (c === '39') state.color = undefined
                else if (c === '49') state.bgColor = undefined
            }
        }
        lastIdx = idx + m[0].length
    }
    if (lastIdx < input.length) {
        const text = input.slice(lastIdx)
        if (text) spans.push({ text, ...state })
    }
    if (spans.length === 0 && input.length > 0) {
        spans.push({ text: input })
    }
    return spans
}

export function stripAnsi(input: string): string {
    return input.replace(ANSI_RE, '')
}

export function toPlainLines(content: string): string[] {
    if (!content) return []
    const v = stripAnsi(content)
    return v.split('\n')
}
