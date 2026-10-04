import type { FeedMessage } from '@/core/entities'
import type { MessageListSchema } from '../types/schema'
import type { ResolvedMessage, ResolvedMessageList } from '../types/resolved'
import { resolveMessageParts } from './resolvePartsSchema'
import { canCopyText, resolveCopyText } from './resolveCopyText'

interface MessageCacheEntry {
    fontSize?: number
    lineHeight?: number
    resolved: ResolvedMessage
}

/**
 * Identity preservation: feed.reducer clones only the touched message,
 * so the same FeedMessage reference means the same content. Reusing the
 * previous ResolvedMessage lets `v-memo="[msg]"` in MessageList skip
 * every bubble that did not change.
 */
const messageCache = new WeakMap<FeedMessage, MessageCacheEntry>()

export function resolveMessageListSchema(schema: MessageListSchema): ResolvedMessageList {
    const fontSize = schema.fontSize
    const lineHeight = schema.lineHeight
    const defaults = { fontSize, lineHeight }
    const messages: ResolvedMessage[] = schema.messages.map((msg) => {
        const cached = messageCache.get(msg)
        if (cached && cached.fontSize === fontSize && cached.lineHeight === lineHeight) {
            return cached.resolved
        }
        const copyText = msg.role === 'user' ? resolveCopyText(msg.blocks) : ''
        const resolved: ResolvedMessage = {
            id: msg.id,
            role: msg.role,
            parts: resolveMessageParts(msg.blocks ?? [], defaults),
            copyText,
            canCopy: canCopyText(msg.role, copyText),
        }
        messageCache.set(msg, { fontSize, lineHeight, resolved })
        return resolved
    })
    return {
        messages,
        loading: !!schema.loading,
        resolveAttachmentUrl: schema.resolveAttachmentUrl,
        contentWidth: schema.contentWidth,
        emptyMessage: schema.emptyMessage ?? 'Start a conversation',
        emptyHint: schema.emptyHint ?? 'Ask a question or describe a task',
        onEditMessage: schema.onEditMessage,
    }
}
