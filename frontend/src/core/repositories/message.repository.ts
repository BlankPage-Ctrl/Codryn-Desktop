import type { FeedEvent, RevertPreview, RevertResult } from '../entities'

export interface MessageRepository {
    loadHistory(workspaceId: string, chatId: string): Promise<FeedEvent[]>
    revert(
        workspaceId: string,
        chatId: string,
        messageId: string,
        restoreFiles?: boolean,
    ): Promise<RevertResult>
    previewRevert(workspaceId: string, chatId: string, messageId: string): Promise<RevertPreview>
}
