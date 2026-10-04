import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Workspace } from '@/core/entities'

export const useWorkspaceStorer = defineStore('workspace', () => {
    const workspaces = ref<Workspace[]>([])
    const selectedWorkspaceId = ref<string | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    const selectedWorkspace = computed(
        () => workspaces.value.find((w) => w.id === selectedWorkspaceId.value) ?? null,
    )

    function setWorkspaces(list: Workspace[]): void {
        workspaces.value = list
    }

    function setSelectedId(id: string | null): void {
        selectedWorkspaceId.value = id
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

    function upsertWorkspace(ws: Workspace): void {
        const idx = workspaces.value.findIndex((w) => w.id === ws.id)
        if (idx === -1) {
            workspaces.value.push(ws)
        } else {
            workspaces.value[idx] = { ...workspaces.value[idx], ...ws }
        }
    }

    function removeWorkspace(id: string): void {
        workspaces.value = workspaces.value.filter((w) => w.id !== id)
        if (selectedWorkspaceId.value === id) {
            selectedWorkspaceId.value = workspaces.value[0]?.id ?? null
        }
    }

    return {
        workspaces,
        selectedWorkspaceId,
        loading,
        error,
        selectedWorkspace,
        setWorkspaces,
        setSelectedId,
        setLoading,
        setError,
        clearError,
        upsertWorkspace,
        removeWorkspace,
    }
})

export type WorkspaceStorer = ReturnType<typeof useWorkspaceStorer>
