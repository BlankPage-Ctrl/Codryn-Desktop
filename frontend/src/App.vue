<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { RouterView } from 'vue-router'
import { IconoirProvider } from '@iconoir/vue'
import AppTitle from '@/presentation/components/AppTitle.vue'
import DialogContainer from '@/presentation/components/dialog/DialogContainer.vue'
import { useWorkspaceStorer } from '@/application/stores'
import {
    workspaceActions,
    appearanceActions,
    themeActions,
    providerActions,
} from '@/application/actions'
import { useSettingsTab } from '@/presentation/composables/useSettingsTab'
import { useDialog } from '@/presentation/composables/useDialog'
import { workspaceFormSchema } from '@/presentation/schemas'
import type { AppSearchItemAny } from '@/presentation/components/app-search/types'

const router = useRouter()
const wsStorer = useWorkspaceStorer()
const settingsTab = useSettingsTab()
const dialog = useDialog()

onMounted(async () => {
    appearanceActions.load()
    await themeActions.load()
    await providerActions.fetchProviders()
    await providerActions.fetchDefaultProvider()
    providerActions.fetchProviderTypes()
    workspaceActions.fetchWorkspaces()
})

// --- AppTitle (title bar) orchestration ---
function onSelectWorkspace(id: string) {
    workspaceActions.selectWorkspace(id)
    router.push({ name: 'workspace', params: { id } })
}

async function onCreateWorkspace() {
    await dialog.spawn({
        title: 'New workspace',
        schema: workspaceFormSchema,
        confirmLabel: 'Create',
        submit: async (data) => {
            const d = data.ws!
            await workspaceActions.createWorkspace({
                name: String(d.name ?? ''),
                description: String(d.description ?? ''),
                projectPath: String(d.projectPath ?? ''),
            })
            if (wsStorer.selectedWorkspaceId) {
                router.push({
                    name: 'workspace',
                    params: { id: wsStorer.selectedWorkspaceId },
                })
            }
        },
    })
}

async function onDeleteWorkspace(id: string) {
    const ws = wsStorer.workspaces.find((w) => w.id === id)
    if (!ws) return
    await dialog.spawn({
        title: 'Delete workspace',
        message: `Delete "${ws.name}"?`,
        confirmLabel: 'Delete',
        confirmVariant: 'danger',
        submit: async () => {
            await workspaceActions.deleteWorkspace(id)
            if (wsStorer.selectedWorkspaceId !== id) return
            const first = wsStorer.workspaces[0]
            if (first) {
                workspaceActions.selectWorkspace(first.id)
                router.push({ name: 'workspace', params: { id: first.id } })
            } else {
                workspaceActions.selectWorkspace(null)
                router.push({ name: 'home' })
            }
        },
    })
}

function onNavigateTestLab() {
    router.push({ name: 'test-lab' })
}

function onSelectSearch(payload: AppSearchItemAny) {
    console.log('[AppSearch] select', payload.kind, payload)
    switch (payload.kind) {
        case 'workspace':
            onSelectWorkspace(payload.payload.id)
            break
        case 'chat':
            if (payload.payload.workspaceId) {
                router.push({
                    name: 'workspace',
                    params: { id: payload.payload.workspaceId },
                    query: { chat: payload.payload.id },
                })
            }
            break
        case 'note':
            break
        case 'file':
        case 'folder':
            console.log('[AppSearch] open file', payload.payload.path)
            break
        case 'setting':
        case 'action':
            break
    }
}
</script>

<template>
    <IconoirProvider>
        <div class="app-shell">
            <AppTitle
                :workspaces="wsStorer.workspaces"
                :selected-workspace-id="wsStorer.selectedWorkspaceId"
                :loading="wsStorer.loading"
                @select-workspace="onSelectWorkspace"
                @create-workspace="onCreateWorkspace"
                @delete-workspace="onDeleteWorkspace"
                @open-settings="settingsTab.requestOpen()"
                @navigate-test-lab="onNavigateTestLab"
                @select-search="onSelectSearch"
            />
            <RouterView v-slot="{ Component }">
                <div class="router-view">
                    <component :is="Component" />
                </div>
            </RouterView>
            <DialogContainer />
        </div>
    </IconoirProvider>
</template>

<style scoped>
.app-shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
}

.router-view {
    flex: 1;
    min-height: 0;
}
</style>
