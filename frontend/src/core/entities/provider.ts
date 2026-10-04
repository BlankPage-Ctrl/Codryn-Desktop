export type ProviderType = string

export interface ProviderTypeInfo {
    id: string
    label: string
    isOfficial: boolean
    requiresBaseURL: boolean
}

export interface ProviderDto {
    name: string
    type: ProviderType
    apiKey?: string
    baseURL?: string
}

export interface Provider {
    id: string
    name: string
    type: ProviderType
    apiKey?: string
    baseURL?: string
    models: Model[]
    createdAt: string
    updatedAt: string
}

export interface ModelDto {
    modelId: string
    displayName?: string
    maxInputTokens?: number
    maxOutputTokens?: number
}

export interface Model {
    id: string
    modelId: string
    displayName?: string
    providerId: string
    maxInputTokens?: number
    maxOutputTokens?: number
    createdAt: string
    updatedAt: string
}
