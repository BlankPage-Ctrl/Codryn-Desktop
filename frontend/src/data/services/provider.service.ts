import {
    List as ListProviders,
    Get as GetProvider,
    Create as CreateProvider,
    Update as UpdateProvider,
    Delete as DeleteProvider,
    ListTypes as ListProviderTypes,
} from '../../../wailsjs/go/providers/Service'
import {
    List as ListModels,
    Create as CreateModel,
    Update as UpdateModel,
    Delete as DeleteModel,
} from '../../../wailsjs/go/models/Service'
import type { Provider, ProviderDto, Model, ModelDto, ProviderTypeInfo } from '@/core/entities'
import type { ProviderRepository, ModelRepository } from '@/core/repositories'

export const providersRepository: ProviderRepository = {
    list: () => ListProviders() as Promise<Provider[]>,
    get: (id: string) => GetProvider(id) as Promise<Provider>,
    create: (dto: ProviderDto) => CreateProvider(dto) as Promise<Provider>,
    update: (id: string, dto: Partial<ProviderDto>) => UpdateProvider(id, dto) as Promise<Provider>,
    remove: (id: string) => DeleteProvider(id) as Promise<void>,
    listTypes: () => ListProviderTypes() as Promise<ProviderTypeInfo[]>,
}

export const modelsRepository: ModelRepository = {
    list: (providerId: string) => ListModels(providerId) as Promise<Model[]>,
    create: (providerId: string, dto: ModelDto) => CreateModel(providerId, dto) as Promise<Model>,
    update: (providerId: string, modelId: string, dto: Partial<ModelDto>) =>
        UpdateModel(providerId, modelId, dto) as Promise<Model>,
    remove: (providerId: string, modelId: string) =>
        DeleteModel(providerId, modelId) as Promise<void>,
}
