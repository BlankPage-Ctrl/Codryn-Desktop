export type ChatMode = 'ask' | 'plan' | 'edit'

export interface ChatDto {
    title: string
    modelId?: string
    providerId?: string
    systemPrompt?: string
    thinkingMode?: string
    mode?: ChatMode
}

export interface Chat {
    id: string
    title: string
    providerId?: string
    modelId?: string
    systemPrompt?: string
    thinkingMode?: string
    mode?: ChatMode
    workspaceId: string
    createdAt: string
    updatedAt: string
}

export type ChatSessionStatus = 'submitted' | 'streaming' | 'ready' | 'error'
