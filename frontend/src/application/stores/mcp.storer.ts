import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { FEMcpServer } from '@/core/entities'

export const useMcpStorer = defineStore('mcp', () => {
    const workspaceId = ref<string | null>(null)
    const servers = ref<FEMcpServer[]>([])
    const source = ref('')
    const loading = ref(false)
    /** Server names with a toggle round-trip in flight. */
    const toggling = ref<Record<string, boolean>>({})
    const error = ref<string | null>(null)

    const readyCount = computed(() => servers.value.filter((s) => s.status === 'ready').length)
    const hasError = computed(() => servers.value.some((s) => s.status === 'error'))

    function selectWorkspace(id: string | null): void {
        workspaceId.value = id
        servers.value = []
        source.value = ''
        toggling.value = {}
        error.value = null
    }

    return {
        workspaceId,
        servers,
        source,
        loading,
        toggling,
        error,
        readyCount,
        hasError,
        selectWorkspace,
    }
})

export type McpStorer = ReturnType<typeof useMcpStorer>
