import {
    LoadHistory,
    PreviewRevertMessages,
    RevertMessages,
} from '../../../wailsjs/go/messages/Service'
import type { FeedEvent, RevertPreview, RevertResult } from '@/core/entities'
import type { MessageRepository } from '@/core/repositories'

export const messagesRepository: MessageRepository = {
    loadHistory: (workspaceId: string, chatId: string) =>
        LoadHistory(workspaceId, chatId) as unknown as Promise<FeedEvent[]>,
    revert: (workspaceId: string, chatId: string, messageId: string, restoreFiles = false) =>
        RevertMessages(
            workspaceId,
            chatId,
            messageId,
            restoreFiles,
        ) as unknown as Promise<RevertResult>,
    previewRevert: (workspaceId: string, chatId: string, messageId: string) =>
        PreviewRevertMessages(workspaceId, chatId, messageId) as unknown as Promise<RevertPreview>,
}
