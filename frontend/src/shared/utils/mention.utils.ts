import type { MentionTriggerRange } from '@/core/entities/mention'

const NAME_RE = /[a-zA-Z0-9_.-]/

export interface DetectMentionAtResult extends MentionTriggerRange {
    kind: '@' | '#'
}

/**
 * Detect mention trigger before caret.
 * Supports both `@` (unified mention) and `#` (direct reference).
 * e.g. "hello @src/ap" at pos 12 -> {kind:'@', prefix:'src/ap', start:6}
 * Frontend will map @-selection to #file: / #folder: token.
 */
export function detectMentionTrigger(
    input: string,
    position: number,
): DetectMentionAtResult | null {
    const i = Math.min(position, input.length)
    // expand prefix chars: allow / in path, but prefix is after trigger
    // For mention we allow a-zA-Z0-9_.-/ as path chars
    let prefixStart = i
    while (prefixStart > 0) {
        const ch = input[prefixStart - 1] ?? ''
        if (/[a-zA-Z0-9_.\-/]/.test(ch)) prefixStart -= 1
        else break
    }
    const triggerChar = prefixStart > 0 ? (input[prefixStart - 1] ?? '') : ''
    if (triggerChar !== '@' && triggerChar !== '#') return null
    // ensure trigger is at start or preceded by whitespace
    if (prefixStart >= 2 && !/\s/.test(input[prefixStart - 2] ?? '')) {
        // Check if trigger inside word without space - still allow for now,'
        // "but reject if previous char is NAME_RE without whitespace separation? allow only if trigger at 0 or whitespace before."
        const before = input[prefixStart - 2]
        if (before !== ' ' && before !== '\n' && before !== '\t') {
            // still allow if trigger is #file: pattern? fallback to stricter lexer logic
            // For UX, require whitespace before @/#
            return null
        }
    }
    const prefix = input.slice(prefixStart, position)
    // prefix must not contain whitespace or illegal chars
    if (/\s/.test(prefix)) return null
    return {
        kind: triggerChar as '@' | '#',
        prefix,
        start: prefixStart - 1,
        end: position,
    }
}

/**
 * Detect using backend-compatible lexer logic (NAME_RE only) for fallback.
 * Returns null if not a valid trigger.
 */
export function detectMentionTriggerStrict(
    input: string,
    position: number,
): DetectMentionAtResult | null {
    let j = Math.min(position, input.length)
    while (j > 0 && NAME_RE.test(input[j - 1] ?? '')) j -= 1
    const trigger = j > 0 ? (input[j - 1] ?? '') : ''
    if (trigger !== '@' && trigger !== '#') return null
    return {
        kind: trigger as '@' | '#',
        prefix: input.slice(j, position),
        start: j - 1,
        end: position,
    }
}

export function buildInsertText(kind: 'file' | 'folder' | 'symbol', value: string): string {
    if (kind === 'folder') return `#folder:${value}`
    if (kind === 'symbol') return `#symbol:${value}`
    return `#file:${value}`
}

export function insertMentionAt(
    input: string,
    range: MentionTriggerRange,
    insertText: string,
): { text: string; caretPos: number } {
    const before = input.slice(0, range.start)
    const after = input.slice(range.end)
    const needsSpace = !after.startsWith(' ') && !after.startsWith('\n')
    const finalInsert = needsSpace ? `${insertText} ` : insertText
    const text = `${before}${finalInsert}${after}`
    return { text, caretPos: before.length + finalInsert.length }
}

export function resolveMentionKind(path: string, isDirectory: boolean): 'file' | 'folder' {
    return isDirectory ? 'folder' : 'file'
}
