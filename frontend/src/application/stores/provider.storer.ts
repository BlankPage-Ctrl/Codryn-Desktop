import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Provider, Model, ProviderTypeInfo } from '@/core/entities'

export const useProviderStorer = defineStore('provider', () => {
    const providers = ref<Provider[]>([])
    const providerTypes = ref<ProviderTypeInfo[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)
    const defaultProviderId = ref<string | null>(null)
    const defaultModelId = ref<string | null>(null)

    function setProviders(list: Provider[]): void {
        providers.value = list
    }

    function setProviderTypes(list: ProviderTypeInfo[]): void {
        providerTypes.value = list
    }

    function setLoading(v: boolean): void {
        loading.value = v
    }

    function setError(message: string | null): void {
        error.value = message
    }

    function clearError(): void {
        error.value = null
    }

    function upsertProvider(provider: Provider): void {
        const idx = providers.value.findIndex((p) => p.id === provider.id)
        if (idx === -1) {
            providers.value.push(provider)
        } else {
            providers.value[idx] = { ...providers.value[idx], ...provider }
        }
    }

    function removeProvider(id: string): void {
        providers.value = providers.value.filter((p) => p.id !== id)
    }

    function upsertModel(providerId: string, model: Model): void {
        const provider = providers.value.find((p) => p.id === providerId)
        if (!provider) return
        const idx = provider.models.findIndex((m) => m.id === model.id)
        if (idx === -1) {
            provider.models = [...provider.models, model]
        } else {
            const next = [...provider.models]
            next[idx] = { ...next[idx]!, ...model }
            provider.models = next
        }
    }

    function removeModel(providerId: string, modelId: string): void {
        const provider = providers.value.find((p) => p.id === providerId)
        if (!provider) return
        provider.models = provider.models.filter((m) => m.id !== modelId)
    }

    function setDefault(providerId: string | null, modelId: string | null): void {
        defaultProviderId.value = providerId
        defaultModelId.value = modelId
    }

    return {
        providers,
        providerTypes,
        loading,
        error,
        defaultProviderId,
        defaultModelId,
        setProviders,
        setProviderTypes,
        setLoading,
        setError,
        clearError,
        upsertProvider,
        removeProvider,
        upsertModel,
        removeModel,
        setDefault,
    }
})

export type ProviderStorer = ReturnType<typeof useProviderStorer>
