import type {
    ChatTokenUsage,
    FeedEvent,
    MessageTokenUsage,
    RevertPreview,
    RevertResult,
} from '../entities'

export interface MessageRepository {
    loadHistory(workspaceId: string, chatId: string): Promise<FeedEvent[]>
    getChatUsage(workspaceId: string, chatId: string): Promise<ChatTokenUsage>
    getMessageUsage(
        workspaceId: string,
        chatId: string,
        messageId: string,
    ): Promise<MessageTokenUsage>
    revert(
        workspaceId: string,
        chatId: string,
        messageId: string,
        restoreFiles?: boolean,
    ): Promise<RevertResult>
    previewRevert(workspaceId: string, chatId: string, messageId: string): Promise<RevertPreview>
}
