import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { FEDiscoveredPlugin, FEPluginState } from '@/core/entities'

export const usePluginStorer = defineStore('plugin', () => {
    const workspaceId = ref<string | null>(null)
    const plugins = ref<FEPluginState[]>([])
    const discovered = ref<FEDiscoveredPlugin[]>([])
    const loading = ref(false)
    /** Plugin ids with a toggle round-trip in flight. */
    const toggling = ref<Record<string, boolean>>({})
    const error = ref<string | null>(null)

    const readyCount = computed(() => plugins.value.filter((p) => p.status === 'ready').length)
    const enabledCount = computed(() => plugins.value.filter((p) => p.enabled).length)

    function selectWorkspace(id: string | null): void {
        workspaceId.value = id
        plugins.value = []
        toggling.value = {}
        error.value = null
    }

    return {
        workspaceId,
        plugins,
        discovered,
        loading,
        toggling,
        error,
        readyCount,
        enabledCount,
        selectWorkspace,
    }
})

export type PluginStorer = ReturnType<typeof usePluginStorer>
