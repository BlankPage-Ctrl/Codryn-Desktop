const PENDING_CHAT_PREFIX = 'pending-'

export function isPendingChatId(chatId: string): boolean {
    return chatId.startsWith(PENDING_CHAT_PREFIX)
}

export function buildPendingChatId(): string {
    return `${PENDING_CHAT_PREFIX}${crypto.randomUUID()}`
}
