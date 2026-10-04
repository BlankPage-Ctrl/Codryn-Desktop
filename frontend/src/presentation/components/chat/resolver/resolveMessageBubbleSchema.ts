import type { MessageBubbleSchema } from '../types/schema'
import type { ResolvedMessageBubble } from '../types/resolved'
import { resolveMessageParts } from './resolvePartsSchema'
import { canCopyText, resolveCopyText } from './resolveCopyText'

export function resolveMessageBubbleSchema(schema: MessageBubbleSchema): ResolvedMessageBubble {
    const canEdit = schema.role === 'user' && !!schema.messageId && !!schema.onEditMessage
    const copyText = schema.role === 'user' ? resolveCopyText(schema.blocks) : ''
    return {
        role: schema.role,
        roleLabel: schema.role === 'user' ? 'You' : 'Assistant',
        avatarLabel: schema.role === 'user' ? 'U' : 'AI',
        parts: resolveMessageParts(schema.blocks ?? []),
        contentWidth: schema.contentWidth,
        messageId: schema.messageId,
        onEditMessage: schema.onEditMessage,
        canEdit,
        copyText,
        canCopy: canCopyText(schema.role, copyText),
    }
}
