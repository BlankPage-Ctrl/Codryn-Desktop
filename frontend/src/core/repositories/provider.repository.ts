import type { Provider, ProviderDto, Model, ModelDto, ProviderTypeInfo } from '../entities/provider'

export interface ProviderRepository {
    list(): Promise<Provider[]>
    get(id: string): Promise<Provider>
    create(dto: ProviderDto): Promise<Provider>
    update(id: string, dto: Partial<ProviderDto>): Promise<Provider>
    remove(id: string): Promise<void>
    listTypes(): Promise<ProviderTypeInfo[]>
}

export interface ModelRepository {
    list(providerId: string): Promise<Model[]>
    create(providerId: string, dto: ModelDto): Promise<Model>
    update(providerId: string, modelId: string, dto: Partial<ModelDto>): Promise<Model>
    remove(providerId: string, modelId: string): Promise<void>
}
