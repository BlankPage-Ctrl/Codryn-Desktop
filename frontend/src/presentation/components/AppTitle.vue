<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
    Copy,
    Minus,
    NavArrowDown,
    Plus,
    Settings as SettingsIcon,
    Square,
    Xmark,
} from '@iconoir/vue'
import DropdownRoot from '@/presentation/components/dropdown/DropdownRoot.vue'
import AppInsightPopover from '@/presentation/components/app-insight/AppInsightPopover.vue'
import AppMcpPopover from '@/presentation/components/app-mcp/AppMcpPopover.vue'
import {
    closeWindow,
    isWindowMaximised,
    minimizeWindow,
    shrinkWailsResizeBorder,
    toggleMaximizeWindow,
} from '@/shared/utils/window.utils'
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

const isMaximised = ref(false)

async function syncMaximisedState() {
    isMaximised.value = await isWindowMaximised()
}

function handleMinimize() {
    minimizeWindow()
}

async function handleToggleMaximize() {
    toggleMaximizeWindow()
    // Runtime has no maximize-change event, refresh state after toggle.
    window.setTimeout(syncMaximisedState, 100)
}

function handleClose() {
    closeWindow()
}

function handleTitleDoubleClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null
    if (target?.closest('button, .ws-group, .title-actions, .window-hitstrip')) return
    void handleToggleMaximize()
}

function handleWindowResize() {
    void syncMaximisedState()
}

onMounted(() => {
    shrinkWailsResizeBorder()
    void syncMaximisedState()
    window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleWindowResize)
})
</script>

<template>
    <div class="app-title" @dblclick="handleTitleDoubleClick">
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

        <div class="title-right">
            <div class="title-actions">
                <!-- <button
                class="title-action-btn ws-testlab-btn"
                @click="openTestLab"
                title="Test Lab"
                aria-label="Test Lab"
            >
                <Flask width="14" height="14" />
            </button> -->
                <AppInsightPopover :workspace-id="selectedWorkspaceId" />
                <AppMcpPopover :workspace-id="selectedWorkspaceId" />
                <button
                    class="title-action-btn ws-settings-btn"
                    @click="openSettings"
                    title="Settings"
                    aria-label="Settings"
                >
                    <SettingsIcon width="14" height="14" />
                </button>
            </div>

            <div class="window-divider" aria-hidden="true"></div>

            <div class="window-hitstrip">
                <div class="window-hitbox" @click="handleMinimize" title="Minimize">
                    <button type="button" class="window-btn" aria-label="Minimize">
                        <Minus width="14" height="14" />
                    </button>
                </div>
                <div
                    class="window-hitbox"
                    @click="handleToggleMaximize"
                    :title="isMaximised ? 'Restore' : 'Maximize'"
                >
                    <button
                        type="button"
                        class="window-btn"
                        :aria-label="isMaximised ? 'Restore' : 'Maximize'"
                    >
                        <Copy v-if="isMaximised" width="12" height="12" />
                        <Square v-else width="12" height="12" />
                    </button>
                </div>
                <div class="window-hitbox window-hitbox--close" @click="handleClose" title="Close">
                    <button type="button" class="window-btn" aria-label="Close">
                        <Xmark width="14" height="14" />
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.app-title {
    height: 35px;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 0 0 0 5px;
    gap: 6px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
    --wails-draggable: drag;
    -webkit-app-region: drag;
    user-select: none;
}

.ws-group {
    display: flex;
    height: 25px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    justify-self: start;
    --wails-draggable: no-drag;
    -webkit-app-region: no-drag;
}

.ws-trigger {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    cursor: pointer;
    user-select: none;
    --wails-draggable: no-drag;
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
    --wails-draggable: no-drag;
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
    min-height: 25px;
}

.app-search-wrapper .app-search {
    flex: 1;
    min-width: 0;
    --wails-draggable: no-drag;
    -webkit-app-region: no-drag;
}

.title-right {
    display: flex;
    align-items: center;
    align-self: stretch;
    gap: 0;
    justify-self: end;
    flex-shrink: 0;
    --wails-draggable: no-drag;
    -webkit-app-region: no-drag;
}

.title-actions {
    display: flex;
    align-items: center;
    align-self: center;
    gap: 4px;
    flex-shrink: 0;
    padding-right: 2px;
    --wails-draggable: no-drag;
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

.window-divider {
    width: 1px;
    height: 18px;
    /* margin: 0 0 0 0; */
    align-self: center;
    background: var(--border-color);
    flex-shrink: 0;
}

.window-hitstrip {
    display: flex;
    align-items: stretch;
    align-self: stretch;
    margin: 0;
    padding: 0;
    flex-shrink: 0;
    --wails-draggable: no-drag;
    -webkit-app-region: no-drag;
}

.window-hitbox {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 37px;
    margin: 0;
    padding: 0;
    background: transparent;
    cursor: pointer;
    --wails-draggable: no-drag;
    -webkit-app-region: no-drag;
}

.window-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 25px;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
    --wails-draggable: no-drag;
    -webkit-app-region: no-drag;
    transition:
        background-color 80ms ease,
        color 80ms ease;
}

.window-hitbox:hover .window-btn {
    background: rgba(var(--raw-border-color), 0.3);
    color: var(--text-primary);
}

.window-hitbox:active .window-btn {
    background: rgba(var(--raw-border-color), 0.5);
}

.window-hitbox--close:hover .window-btn {
    background: var(--color-danger);
    color: #ffffff;
}

.window-hitbox--close:active .window-btn {
    background: var(--color-danger);
    filter: brightness(0.85);
    color: #ffffff;
}

.window-btn:focus-visible {
    outline: 1px solid var(--border-color);
    outline-offset: -1px;
}
</style>
