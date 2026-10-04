import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { FEInsightIndexStatus } from '@/core/entities'

export const useInsightStorer = defineStore('insight', () => {
    const workspaceId = ref<string | null>(null)
    const running = ref(false)
    const enabled = ref(false)
    /** True while a sync/index pass is in flight - drives the AppTitle dot. */
    const syncing = ref(false)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const lastSyncAt = ref<string | null>(null)
    const indexStatus = ref<FEInsightIndexStatus | null>(null)

    const active = computed(() => syncing.value)

    function selectWorkspace(id: string | null): void {
        workspaceId.value = id
        running.value = false
        syncing.value = false
        error.value = null
        indexStatus.value = null
    }

    return {
        workspaceId,
        running,
        enabled,
        syncing,
        active,
        loading,
        error,
        lastSyncAt,
        indexStatus,
        selectWorkspace,
    }
})

export type InsightStorer = ReturnType<typeof useInsightStorer>
