import { List, Get, Create, Update, Delete } from '../../../wailsjs/go/chats/Service'
import type { Chat, ChatDto } from '@/core/entities'
import type { ChatRepository } from '@/core/repositories'

export const chatsRepository: ChatRepository = {
    list: (workspaceId: string) => List(workspaceId) as Promise<Chat[]>,
    get: (workspaceId: string, chatId: string) => Get(workspaceId, chatId) as Promise<Chat>,
    create: (workspaceId: string, dto: ChatDto) => Create(workspaceId, dto) as Promise<Chat>,
    update: (workspaceId: string, chatId: string, dto: Partial<ChatDto>) =>
        Update(workspaceId, chatId, dto) as Promise<Chat>,
    remove: (workspaceId: string, chatId: string) => Delete(workspaceId, chatId) as Promise<void>,
}
