<script setup lang="ts">
import { computed } from 'vue'
import { NavArrowDown, Plus, Settings as SettingsIcon } from '@iconoir/vue'
import DropdownRoot from '@/presentation/components/dropdown/DropdownRoot.vue'
import AppInsightPopover from '@/presentation/components/app-insight/AppInsightPopover.vue'
import AppMcpPopover from '@/presentation/components/app-mcp/AppMcpPopover.vue'
import type { CommandAction } from '@/presentation/components/dropdown/types'
import type { Workspace } from '@/core/entities'
import type { AppSearchItemAny } from '@/presentation/components/app-search/types'
import {
    createWorkspaceDropdownItems,
    workspaceDropdownProps,
    WORKSPACE_COMMANDS,
} from '@/presentation/schemas'

const props = defineProps<{
    workspaces: Workspace[]
    selectedWorkspaceId: string | null
    loading?: boolean
}>()

const emit = defineEmits<{
    'select-workspace': [id: string]
    'create-workspace': []
    'delete-workspace': [id: string]
    'open-settings': []
    'navigate-test-lab': []
    'select-search': [payload: AppSearchItemAny]
}>()

const selectedWsName = computed(() => {
    const ws = props.workspaces.find((w) => w.id === props.selectedWorkspaceId)
    return ws ? ws.name : 'Select workspace'
})

const wsDropdownItems = computed(() =>
    createWorkspaceDropdownItems({
        workspaces: props.workspaces,
        selectedWorkspaceId: props.selectedWorkspaceId,
    }),
)

function handleSelect(value: string) {
    emit('select-workspace', value)
}

function handleAction(action: CommandAction) {
    if (action.command === WORKSPACE_COMMANDS.ADD) {
        emit('create-workspace')
    } else if (action.command === WORKSPACE_COMMANDS.DELETE) {
        const id = action.args?.id as string
        if (id) emit('delete-workspace', id)
    }
}

function openSettings() {
    emit('open-settings')
}
</script>

<template>
    <div class="app-title">
        <div class="ws-group">
            <DropdownRoot
                :items="wsDropdownItems"
                v-bind="workspaceDropdownProps"
                @select="handleSelect"
                @action="handleAction"
            >
                <template #trigger="{ isOpen, toggle }">
                    <div
                        class="ws-trigger"
                        :class="{ 'ws-trigger--open': isOpen }"
                        @click="toggle"
                        role="button"
                        tabindex="0"
                        aria-haspopup="true"
                        :aria-expanded="isOpen"
                    >
                        <span class="ws-trigger__label">{{ selectedWsName }}</span>
                        <NavArrowDown
                            width="12"
                            height="12"
                            class="ws-trigger__chevron"
                            :class="{ 'ws-trigger__chevron--open': isOpen }"
                        />
                    </div>
                </template>
            </DropdownRoot>

            <button
                class="ws-add-btn"
                @click="emit('create-workspace')"
                title="New workspace"
                aria-label="New workspace"
            >
                <Plus width="14" height="14" />
            </button>
        </div>

        <div class="app-search-wrapper">
            <!-- <AppSearchBar @select="handleSearchSelect" /> -->
        </div>

        <div class="title-actions">
            <AppInsightPopover :workspace-id="selectedWorkspaceId" />
            <AppMcpPopover :workspace-id="selectedWorkspaceId" />
            <!-- <button
                class="title-action-btn ws-testlab-btn"
                @click="openTestLab"
                title="Test Lab"
                aria-label="Test Lab"
            >
                <Flask width="14" height="14" />
            </button> -->
            <button
                class="title-action-btn ws-settings-btn"
                @click="openSettings"
                title="Settings"
                aria-label="Settings"
            >
                <SettingsIcon width="14" height="14" />
            </button>
        </div>
    </div>
</template>

<style scoped>
.app-title {
    height: 35px;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 1px 5px;
    gap: 6px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
    -webkit-app-region: drag;
}

.ws-group {
    display: flex;
    height: 25px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    justify-self: start;
    -webkit-app-region: no-drag;
}

.ws-trigger {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    cursor: pointer;
    user-select: none;
    -webkit-app-region: no-drag;
    transition: background-color 80ms ease;
    width: 140px;
    flex-shrink: 0;
    border-radius: 4px 0 0 4px;
}

.ws-trigger:hover,
.ws-trigger--open {
    background: rgba(var(--raw-border-color), 0.3);
}

.ws-trigger__label {
    flex: 1;
    min-width: 0;
    font-size: var(--type-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    opacity: 0.75;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ws-trigger__chevron {
    color: var(--text-primary);
    transition: transform 120ms ease;
}

.ws-trigger__chevron--open {
    transform: rotate(180deg);
}

.ws-add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-left: 1px solid var(--border-color);
    border-radius: 0 4px 4px 0;
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
    -webkit-app-region: no-drag;
    transition:
        background-color 80ms ease,
        color 80ms ease;
}

.ws-add-btn:hover {
    background: rgba(var(--raw-border-color), 0.3);
    color: var(--text-primary);
}

.app-search-wrapper {
    display: flex;
    align-items: center;
    gap: 6px;
    justify-content: center;
    justify-self: center;
    width: clamp(260px, 42vw, 520px);
    min-width: 0;
    -webkit-app-region: no-drag;
}

.app-search-wrapper .app-search {
    flex: 1;
    min-width: 0;
}

.title-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    justify-self: end;
    flex-shrink: 0;
    -webkit-app-region: no-drag;
}

.title-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
    border: none;
    transition:
        background-color 80ms ease,
        color 80ms ease;
}

.title-action-btn:hover {
    background: rgba(var(--raw-border-color), 0.3);
    color: var(--text-primary);
}

.title-action-btn:disabled {
    opacity: 0.35;
    cursor: default;
}

.title-action-btn:disabled:hover {
    background: transparent;
}

.ws-settings-btn {
    color: var(--text-primary);
}

.ws-settings-btn:hover {
    color: var(--text-primary);
}

.ws-testlab-btn {
    color: var(--text-primary);
}

.ws-testlab-btn:hover {
    color: var(--text-primary);
}
</style>
