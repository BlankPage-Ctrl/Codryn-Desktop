import type { ChatRepository } from '@/core/repositories'
import type { Chat, ChatDto } from '@/core/entities'

export interface ChatBusinessLogic {
    list(workspaceId: string): Promise<Chat[]>
    create(workspaceId: string, dto: ChatDto): Promise<Chat>
    update(workspaceId: string, chatId: string, dto: Partial<ChatDto>): Promise<Chat>
    remove(workspaceId: string, chatId: string): Promise<void>
}

export function createChatBusinessLogic(repo: ChatRepository): ChatBusinessLogic {
    return {
        list: (workspaceId) => repo.list(workspaceId),
        create: (workspaceId, dto) => repo.create(workspaceId, dto),
        update: (workspaceId, chatId, dto) => repo.update(workspaceId, chatId, dto),
        remove: (workspaceId, chatId) => repo.remove(workspaceId, chatId),
    }
}
