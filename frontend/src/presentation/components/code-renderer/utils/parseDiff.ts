export type DiffLineKind = 'hunk' | 'add' | 'del' | 'context' | 'truncated'

export interface DiffLine {
    kind: DiffLineKind
    prefix: string
    text: string
    raw: string
}

export function parseUnifiedDiff(diff: string): DiffLine[] {
    if (!diff || diff.trim() === '') return []
    const rawLines = diff.split('\n')
    // Remove trailing empty due to split if diff ends with \n
    if (rawLines.length > 0 && rawLines[rawLines.length - 1] === '') rawLines.pop()
    const out: DiffLine[] = []
    for (const raw of rawLines) {
        if (raw.startsWith('@@')) {
            out.push({ kind: 'hunk', prefix: '@@', text: raw, raw })
            continue
        }
        if (raw.startsWith('... ') || raw === '... (diff truncated)') {
            out.push({ kind: 'truncated', prefix: '...', text: raw, raw })
            continue
        }
        const prefix = raw[0] ?? ' '
        const text = raw.slice(1)
        if (prefix === '+') {
            out.push({ kind: 'add', prefix: '+', text, raw })
        } else if (prefix === '-') {
            out.push({ kind: 'del', prefix: '-', text, raw })
        } else {
            // ' ' or anything else is context
            out.push({
                kind: 'context',
                prefix: prefix === ' ' ? ' ' : prefix,
                text: prefix === ' ' ? text : raw,
                raw,
            })
        }
    }
    return out
}
