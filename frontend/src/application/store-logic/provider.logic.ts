import type { Provider, Model, ProviderTypeInfo } from '@/core/entities'
import type { ProviderStorer } from '../stores/provider.storer'

export interface ProviderStoreLogic {
    beginLoad(): void
    endLoad(): void
    setError(message: string): void
    clearError(): void
    setProviders(list: Provider[]): void
    setProviderTypes(list: ProviderTypeInfo[]): void
    upsertProvider(provider: Provider): void
    removeProvider(id: string): void
    upsertModel(providerId: string, model: Model): void
    removeModel(providerId: string, modelId: string): void
    setDefault(providerId: string | null, modelId: string | null): void
}

export function createProviderStoreLogic(getStorer: () => ProviderStorer): ProviderStoreLogic {
    function beginLoad(): void {
        const storer = getStorer()
        storer.setLoading(true)
        storer.clearError()
    }

    function endLoad(): void {
        getStorer().setLoading(false)
    }

    function setError(message: string): void {
        getStorer().setError(message)
    }

    function clearError(): void {
        getStorer().clearError()
    }

    function setProviders(list: Provider[]): void {
        getStorer().setProviders(list)
    }

    function setProviderTypes(list: ProviderTypeInfo[]): void {
        getStorer().setProviderTypes(list)
    }

    function upsertProvider(provider: Provider): void {
        getStorer().upsertProvider(provider)
    }

    function removeProvider(id: string): void {
        const storer = getStorer()
        storer.removeProvider(id)
        if (storer.defaultProviderId === id) {
            storer.setDefault(null, null)
        }
    }

    function upsertModel(providerId: string, model: Model): void {
        getStorer().upsertModel(providerId, model)
    }

    function removeModel(providerId: string, modelId: string): void {
        const storer = getStorer()
        storer.removeModel(providerId, modelId)
        if (storer.defaultModelId === modelId) {
            storer.setDefault(storer.defaultProviderId, null)
        }
    }

    function setDefault(providerId: string | null, modelId: string | null): void {
        getStorer().setDefault(providerId, modelId)
    }

    return {
        beginLoad,
        endLoad,
        setError,
        clearError,
        setProviders,
        setProviderTypes,
        upsertProvider,
        removeProvider,
        upsertModel,
        removeModel,
        setDefault,
    }
}
