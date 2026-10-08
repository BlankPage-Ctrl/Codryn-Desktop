import { List, Get, Create, Update, Delete, GenerateTitle } from '../../../wailsjs/go/chats/Service'
import type { Chat, ChatDto } from '@/core/entities'
import type { ChatRepository, GenerateChatTitleInput } from '@/core/repositories'

export const chatsRepository: ChatRepository = {
    list: (workspaceId: string) => List(workspaceId) as Promise<Chat[]>,
    get: (workspaceId: string, chatId: string) => Get(workspaceId, chatId) as Promise<Chat>,
    // The domain title is optional: omit it when empty so the backend
    // owns the fallback title instead of receiving an empty string.
    create: (workspaceId: string, dto: ChatDto) => {
        const title = dto.title?.trim()
        return Create(workspaceId, {
            ...dto,
            ...(title ? { title } : { title: undefined }),
        }) as Promise<Chat>
    },
    update: (workspaceId: string, chatId: string, dto: Partial<ChatDto>) =>
        Update(workspaceId, chatId, dto) as Promise<Chat>,
    remove: (workspaceId: string, chatId: string) => Delete(workspaceId, chatId) as Promise<void>,
    generateTitle: (workspaceId: string, chatId: string, input: GenerateChatTitleInput) =>
        GenerateTitle(workspaceId, chatId, input) as Promise<Chat>,
}
