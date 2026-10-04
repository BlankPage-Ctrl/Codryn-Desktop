import type { FeedMessage } from '@/core/entities'

/** Plain text of a message, joining its text blocks. Used by the copy action. */
export function resolveCopyText(blocks: FeedMessage['blocks'] | undefined): string {
    return (blocks ?? [])
        .filter((b) => b.kind === 'text')
        .map((b) => b.text)
        .join('\n')
}

export function canCopyText(role: unknown, copyText: string): boolean {
    return role === 'user' && copyText.trim().length > 0
}
