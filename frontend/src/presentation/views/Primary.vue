<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Album } from '@iconoir/vue'
import { pButton } from '@/presentation/components/button'
import { Header } from '@/presentation/components/header'
import type { HeaderSchema } from '@/presentation/components/header'
import { ContainerGrid } from '@/presentation/components/container'
import { useDialog } from '@/presentation/composables/useDialog'
import { useSettingsTab } from '@/presentation/composables/useSettingsTab'
import { AppList } from '@/presentation/components/list'
import { useWorkspaceStorer } from '@/application/stores'
import { useChatStorer } from '@/application/stores'
import { workspaceActions, chatActions } from '@/application/actions'
import type { Workspace } from '@/core/entities'
import {
    workspaceFormSchema,
    chatListContentSchema,
    createWorkspaceListSchema,
    createWorkspacesHeaderSchema,
    createChatHeaderSchema,
    primaryLayout,
} from '@/presentation/schemas'

const wsStorer = useWorkspaceStorer()
const chatStorer = useChatStorer()
const router = useRouter()
const dialog = useDialog()
const settingsTab = useSettingsTab()

function goToSettings() {
    settingsTab.requestOpen()
}

// --- Header schemas ---
const wsHeaderSchema = computed(() =>
    createWorkspacesHeaderSchema({
        onSettings: goToSettings,
        onCreate: openWsCreate,
    }),
)

const chatHeaderSchema = computed<HeaderSchema | null>(() => {
    if (!wsStorer.selectedWorkspace) return null
    return createChatHeaderSchema({
        title: wsStorer.selectedWorkspace.name,
        subtitle: `${chatStorer.chats.length} chat${chatStorer.chats.length !== 1 ? 's' : ''}`,
        onOpen: openWorkspace,
    })
})

const containerPrimary = ref(primaryLayout)

// --- List schemas ---
const wsListSchema = computed(() =>
    createWorkspaceListSchema({
        activeWorkspaceId: wsStorer.selectedWorkspaceId,
        onSelect: (ws) => workspaceActions.selectWorkspace(ws.id),
        onEdit: openWsEdit,
        onDelete: confirmDeleteWs,
        onCreate: openWsCreate,
    }),
)

// --- Workspace form ---
function openWsCreate() {
    dialog.spawn({
        title: 'New workspace',
        schema: workspaceFormSchema,
        confirmLabel: 'Create',
        submit: async (data) => {
            const ws = data.ws!
            await workspaceActions.createWorkspace({
                name: String(ws.name ?? ''),
                description: String(ws.description ?? ''),
                projectPath: String(ws.projectPath ?? ''),
            })
        },
    })
}

function openWsEdit(ws: Workspace) {
    dialog.spawn({
        title: 'Edit workspace',
        schema: workspaceFormSchema,
        initialData: {
            ws: {
                name: ws.name,
                description: ws.description ?? '',
                projectPath: ws.projectPath,
            },
        },
        confirmLabel: 'Save',
        submit: async (data) => {
            const w = data.ws!
            await workspaceActions.updateWorkspace(ws.id, {
                name: String(w.name ?? ''),
                description: String(w.description ?? ''),
                projectPath: String(w.projectPath ?? ''),
            })
        },
    })
}

// --- Workspace delete ---
function confirmDeleteWs(ws: Workspace) {
    dialog.spawn({
        title: 'Delete workspace',
        message: `Delete "${ws.name}"?`,
        confirmLabel: 'Delete',
        confirmVariant: 'danger',
        submit: async () => {
            await workspaceActions.deleteWorkspace(ws.id)
        },
    })
}

function openWorkspace() {
    if (wsStorer.selectedWorkspaceId) {
        router.push({ name: 'workspace', params: { id: wsStorer.selectedWorkspaceId } })
    }
}

onMounted(() => {
    workspaceActions.fetchWorkspaces()
})

watch(
    () => wsStorer.selectedWorkspaceId,
    (id) => {
        if (id) {
            chatActions.fetchChats(id)
        } else {
            chatStorer.setChats([])
        }
    },
)
</script>

<template>
    <div style="height: 100%">
        <ContainerGrid :schema="containerPrimary" :animate="true" :animation-ms="200">
            <!-- WORKSPACE SIDEBAR -->
            <template #cell-1-1>
                <div class="ws-sidebar">
                    <Header :schema="wsHeaderSchema" />

                    <!-- Loading -->
                    <div v-if="wsStorer.loading && !wsStorer.workspaces.length" class="ws-empty">
                        <span class="text-muted">Loading...</span>
                    </div>

                    <!-- Error -->
                    <div v-else-if="wsStorer.error && !wsStorer.workspaces.length" class="ws-empty">
                        <span class="text-muted">{{ wsStorer.error }}</span>
                        <pButton
                            :schema="{ preset: 'ghost', size: 'sm', label: 'Retry' }"
                            @click="workspaceActions.fetchWorkspaces()"
                        />
                    </div>

                    <!-- Workspace list -->
                    <AppList v-else :schema="wsListSchema" :items="wsStorer.workspaces" />
                </div>
            </template>

            <!-- CHAT CONTENT -->
            <template #cell-1-2>
                <div class="chat-content">
                    <!-- No workspace selected: welcome -->
                    <div v-if="!wsStorer.selectedWorkspace" class="welcome-state">
                        <div class="welcome-icon">
                            <Album width="48" height="48" style="opacity: 0.3" />
                        </div>
                        <h2 class="welcome-title">Welcome</h2>
                        <p class="welcome-desc">
                            Select a workspace from the sidebar to view and manage its chats, or
                            create a new workspace to get started.
                        </p>
                    </div>

                    <!-- Workspace selected -->
                    <template v-else>
                        <Header v-if="chatHeaderSchema" :schema="chatHeaderSchema" />

                        <!-- Chat list -->
                        <AppList :schema="chatListContentSchema" :items="chatStorer.chats" />
                    </template>
                </div>
            </template>
        </ContainerGrid>
    </div>
</template>

<style scoped>
.ws-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.chat-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.ws-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 24px 12px;
}

.welcome-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 32px;
    text-align: center;
}

.welcome-icon {
    margin-bottom: 16px;
    color: var(--text-primary);
}

.welcome-title {
    font-family: var(--font-serif);
    font-size: var(--type-2xl);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0 0 6px;
}

.welcome-desc {
    font-size: var(--type-md);
    color: var(--text-primary);
    opacity: 0.5;
    max-width: 300px;
    line-height: 1.5;
    margin: 0;
}
</style>
