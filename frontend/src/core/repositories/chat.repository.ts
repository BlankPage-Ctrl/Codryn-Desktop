import type { Chat, ChatDto } from '../entities/chat'

export interface GenerateChatTitleInput {
    text: string
    providerId?: string
    modelId?: string
}

export interface ChatRepository {
    list(workspaceId: string): Promise<Chat[]>
    get(workspaceId: string, chatId: string): Promise<Chat>
    create(workspaceId: string, dto: ChatDto): Promise<Chat>
    update(workspaceId: string, chatId: string, dto: Partial<ChatDto>): Promise<Chat>
    remove(workspaceId: string, chatId: string): Promise<void>
    generateTitle(workspaceId: string, chatId: string, input: GenerateChatTitleInput): Promise<Chat>
}
