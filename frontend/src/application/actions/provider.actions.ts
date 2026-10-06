import type { ProviderStoreLogic } from '../store-logic/provider.logic'
import type { ProviderBusinessLogic } from '../business-logic/provider.logic'
import type { ProviderDto, ModelDto, ProviderTypeInfo } from '@/core/entities'
import { toMessage } from '@/shared/utils/error.utils'

const BUILTIN_PROVIDER_TYPES: ProviderTypeInfo[] = [
    { id: 'openai', label: 'OpenAI', isOfficial: true, requiresBaseURL: false },
    {
        id: 'openai-compatible',
        label: 'OpenAI Compatible',
        isOfficial: true,
        requiresBaseURL: true,
    },
    { id: 'openrouter', label: 'OpenRouter', isOfficial: true, requiresBaseURL: false },
]

export interface ProviderActions {
    fetchProviders(): Promise<void>
    fetchProviderTypes(): Promise<void>
    createProvider(dto: ProviderDto): Promise<void>
    updateProvider(id: string, dto: Partial<ProviderDto>): Promise<void>
    deleteProvider(id: string): Promise<void>
    createModel(providerId: string, dto: ModelDto): Promise<void>
    updateModel(providerId: string, modelId: string, dto: Partial<ModelDto>): Promise<void>
    deleteModel(providerId: string, modelId: string): Promise<void>
    fetchDefaultProvider(): Promise<void>
    setDefaultProvider(providerId: string, modelId: string): Promise<void>
}

export function createProviderActions(
    storeLogic: ProviderStoreLogic,
    businessLogic: ProviderBusinessLogic,
): ProviderActions {
    async function fetchProviders(): Promise<void> {
        try {
            storeLogic.beginLoad()
            storeLogic.setProviders(await businessLogic.listProviders())
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to load providers')
        } finally {
            storeLogic.endLoad()
        }
    }

    async function fetchProviderTypes(): Promise<void> {
        try {
            const types = await businessLogic.listProviderTypes()
            storeLogic.setProviderTypes(types.length > 0 ? types : BUILTIN_PROVIDER_TYPES)
        } catch {
            storeLogic.setProviderTypes(BUILTIN_PROVIDER_TYPES)
        }
    }

    async function createProvider(dto: ProviderDto): Promise<void> {
        storeLogic.clearError()
        try {
            storeLogic.upsertProvider(await businessLogic.createProvider(dto))
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to create provider')
            throw e
        }
    }

    async function updateProvider(id: string, dto: Partial<ProviderDto>): Promise<void> {
        storeLogic.clearError()
        try {
            storeLogic.upsertProvider(await businessLogic.updateProvider(id, dto))
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to update provider')
            throw e
        }
    }

    async function deleteProvider(id: string): Promise<void> {
        storeLogic.clearError()
        try {
            await businessLogic.removeProvider(id)
            storeLogic.removeProvider(id)
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to delete provider')
            throw e
        }
    }

    async function createModel(providerId: string, dto: ModelDto): Promise<void> {
        storeLogic.clearError()
        try {
            storeLogic.upsertModel(providerId, await businessLogic.createModel(providerId, dto))
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to create model')
            throw e
        }
    }

    async function updateModel(
        providerId: string,
        modelId: string,
        dto: Partial<ModelDto>,
    ): Promise<void> {
        storeLogic.clearError()
        try {
            storeLogic.upsertModel(
                providerId,
                await businessLogic.updateModel(providerId, modelId, dto),
            )
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to update model')
            throw e
        }
    }

    async function deleteModel(providerId: string, modelId: string): Promise<void> {
        storeLogic.clearError()
        try {
            await businessLogic.removeModel(providerId, modelId)
            storeLogic.removeModel(providerId, modelId)
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to delete model')
            throw e
        }
    }

    async function fetchDefaultProvider(): Promise<void> {
        try {
            const data = await businessLogic.getDefaultProvider()
            storeLogic.setDefault(data.providerId, data.modelId)
        } catch {
            /* ignore */
        }
    }

    async function setDefaultProvider(providerId: string, modelId: string): Promise<void> {
        storeLogic.clearError()
        try {
            await businessLogic.setDefaultProvider(providerId, modelId)
            storeLogic.setDefault(providerId, modelId)
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to set default provider')
            throw e
        }
    }

    return {
        fetchProviders,
        fetchProviderTypes,
        createProvider,
        updateProvider,
        deleteProvider,
        createModel,
        updateModel,
        deleteModel,
        fetchDefaultProvider,
        setDefaultProvider,
    }
}
