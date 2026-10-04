import type { ChatSessionStoreLogic } from '../store-logic/chat-session.logic'
import type { ChatSessionEngine, SendEditResult } from '../business-logic/chat-session.logic'
import type { ChatImageAttachment, RevertPreview } from '@/core/entities'

export interface ChatSessionActions {
    loadHistory(workspaceId: string, chatId: string): Promise<void>
    sendMessage(
        workspaceId: string,
        chatId: string,
        text: string,
        attachments?: ChatImageAttachment[],
    ): Promise<void>
    beginEdit(chatId: string, messageId: string): string | null
    previewEdit(
        workspaceId: string,
        chatId: string,
        messageId: string,
    ): Promise<RevertPreview | null>
    sendEdit(
        workspaceId: string,
        chatId: string,
        messageId: string,
        text: string,
        opts?: { restoreFiles?: boolean },
    ): Promise<SendEditResult>
    stop(chatId: string): Promise<void>
    dispose(chatId: string): void
    clear(): void
    dismissError(chatId: string): void
}

export function createChatSessionActions(
    storeLogic: ChatSessionStoreLogic,
    businessLogic: ChatSessionEngine,
): ChatSessionActions {
    async function loadHistory(workspaceId: string, chatId: string): Promise<void> {
        await businessLogic.loadHistory(workspaceId, chatId)
    }

    async function sendMessage(
        workspaceId: string,
        chatId: string,
        text: string,
        attachments?: ChatImageAttachment[],
    ): Promise<void> {
        await businessLogic.sendMessage(workspaceId, chatId, text, attachments)
    }

    function beginEdit(chatId: string, messageId: string): string | null {
        return businessLogic.beginEdit(chatId, messageId)
    }

    async function previewEdit(
        workspaceId: string,
        chatId: string,
        messageId: string,
    ): Promise<RevertPreview | null> {
        return businessLogic.previewEdit(workspaceId, chatId, messageId)
    }

    async function sendEdit(
        workspaceId: string,
        chatId: string,
        messageId: string,
        text: string,
        opts?: { restoreFiles?: boolean },
    ): Promise<SendEditResult> {
        return businessLogic.sendEdit(workspaceId, chatId, messageId, text, opts)
    }

    async function stop(chatId: string): Promise<void> {
        await businessLogic.stop(chatId)
    }

    function dispose(chatId: string): void {
        businessLogic.dispose(chatId)
        storeLogic.remove(chatId)
    }

    function clear(): void {
        businessLogic.clear()
        storeLogic.clear()
    }

    function dismissError(chatId: string): void {
        storeLogic.patch(chatId, { error: undefined })
    }

    return {
        loadHistory,
        sendMessage,
        beginEdit,
        previewEdit,
        sendEdit,
        stop,
        dispose,
        clear,
        dismissError,
    }
}
