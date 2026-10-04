import type { ProviderRepository, ModelRepository, SettingsRepository } from '@/core/repositories'
import type {
    Provider,
    ProviderDto,
    Model,
    ModelDto,
    DefaultProvider,
    ProviderTypeInfo,
} from '@/core/entities'

export interface ProviderBusinessLogicDeps {
    providersRepo: ProviderRepository
    modelsRepo: ModelRepository
    settingsRepo: SettingsRepository
}

export interface ProviderBusinessLogic {
    listProviders(): Promise<Provider[]>
    listProviderTypes(): Promise<ProviderTypeInfo[]>
    createProvider(dto: ProviderDto): Promise<Provider>
    updateProvider(id: string, dto: Partial<ProviderDto>): Promise<Provider>
    removeProvider(id: string): Promise<void>
    createModel(providerId: string, dto: ModelDto): Promise<Model>
    updateModel(providerId: string, modelId: string, dto: Partial<ModelDto>): Promise<Model>
    removeModel(providerId: string, modelId: string): Promise<void>
    getDefaultProvider(): Promise<DefaultProvider>
    setDefaultProvider(providerId: string, modelId: string): Promise<DefaultProvider>
}

export function createProviderBusinessLogic(
    deps: ProviderBusinessLogicDeps,
): ProviderBusinessLogic {
    return {
        listProviders: () => deps.providersRepo.list(),
        listProviderTypes: () => deps.providersRepo.listTypes(),
        createProvider: (dto) => deps.providersRepo.create(dto),
        updateProvider: (id, dto) => deps.providersRepo.update(id, dto),
        removeProvider: (id) => deps.providersRepo.remove(id),
        createModel: (providerId, dto) => deps.modelsRepo.create(providerId, dto),
        updateModel: (providerId, modelId, dto) => deps.modelsRepo.update(providerId, modelId, dto),
        removeModel: (providerId, modelId) => deps.modelsRepo.remove(providerId, modelId),
        getDefaultProvider: () => deps.settingsRepo.getDefaultProvider(),
        setDefaultProvider: (providerId, modelId) =>
            deps.settingsRepo.setDefaultProvider(providerId, modelId),
    }
}
