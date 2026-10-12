<script setup lang="ts">
import { Plus, Puzzle, Refresh, Trash } from '@iconoir/vue'
import type { FEDiscoveredPlugin, FEPluginState } from '@/core/entities'

const props = defineProps<{
    discovered: FEDiscoveredPlugin[]
    states: FEPluginState[]
    loading: boolean
    error: string | null
    onDiscover: () => void
    onRegister: (pluginId: string, pluginDir: string) => void
    onUnregister: (pluginId: string) => void
    onToggle: (id: string, enabled: boolean) => void
}>()

interface PluginStatus {
    label: string
    ready: boolean
    hint: string | null
}

function workspaceState(plugin: FEDiscoveredPlugin): FEPluginState | undefined {
    return props.states.find((s) => s.id === plugin.id)
}

function isChecked(plugin: FEDiscoveredPlugin): boolean {
    const ws = workspaceState(plugin)
    return ws ? ws.enabled : plugin.enabled
}

function statusOf(plugin: FEDiscoveredPlugin): PluginStatus {
    if (plugin.registered && !plugin.enabled) {
        return { label: 'Disabled', ready: false, hint: 'Disabled for all workspaces' }
    }
    const ws = workspaceState(plugin)
    if (plugin.registered && ws && !ws.enabled) {
        return { label: 'Disabled', ready: false, hint: 'Disabled in this workspace' }
    }
    if (ws && ws.status === 'error') {
        return { label: 'Error', ready: false, hint: ws.error ?? 'Plugin failed to load' }
    }
    if (plugin.manifestValid) return { label: 'Ready', ready: true, hint: null }
    const notices = plugin.notices ?? []
    const missing = notices.some((notice) => /no codryn-plugin\.json|not found/i.test(notice))
    return {
        label: missing ? 'Missing manifest' : 'Invalid manifest',
        ready: false,
        hint: notices[0] ?? null,
    }
}
</script>

<template>
    <div class="plugin-list">
        <div class="plugin-list-header">
            <div class="list-heading">
                <span class="list-title">Plugins</span>
            </div>
            <button
                class="plugin-icon-btn"
                title="Refresh"
                aria-label="Refresh plugin list"
                @click="onDiscover"
            >
                <Refresh width="14" height="14" />
            </button>
        </div>

        <div v-if="loading" class="list-empty">Loading plugins…</div>

        <div v-else-if="error" class="list-empty list-empty--error">{{ error }}</div>

        <div v-else-if="discovered.length === 0" class="list-empty">
            <Puzzle width="28" height="28" class="plugin-empty-icon" />
            <p class="plugin-empty-title">No plugins yet</p>
            <p class="plugin-empty-hint">Choose a folder above to add your first plugin.</p>
        </div>

        <div v-else class="list-items">
            <div v-for="plugin in discovered" :key="plugin.id" class="plugin-row">
                <span
                    class="plugin-dot"
                    :class="{ 'plugin-dot--ready': statusOf(plugin).ready }"
                    aria-hidden="true"
                />
                <div class="plugin-info">
                    <div class="plugin-top">
                        <span class="plugin-name">{{ plugin.id }}</span>
                        <span
                            class="plugin-status"
                            :class="{ 'plugin-status--ready': statusOf(plugin).ready }"
                            :title="plugin.notices.join('\n')"
                            >{{ statusOf(plugin).label }}</span
                        >
                    </div>
                    <span class="plugin-path" :title="plugin.dir">{{ plugin.dir }}</span>
                    <span
                        v-if="statusOf(plugin).hint"
                        class="plugin-hint"
                        :title="plugin.notices.join('\n')"
                        >{{ statusOf(plugin).hint }}</span
                    >
                </div>
                <div class="plugin-actions">
                    <label
                        v-if="plugin.registered"
                        class="toggle"
                        :title="isChecked(plugin) ? 'Disable' : 'Enable'"
                    >
                        <input
                            type="checkbox"
                            :checked="isChecked(plugin)"
                            :aria-label="`Toggle ${plugin.id}`"
                            @change="onToggle(plugin.id, !isChecked(plugin))"
                        />
                        <span class="toggle-track"></span>
                    </label>
                    <button
                        v-if="plugin.registered"
                        class="plugin-icon-btn plugin-icon-btn--danger"
                        title="Remove"
                        :aria-label="`Remove ${plugin.id}`"
                        @click="onUnregister(plugin.id)"
                    >
                        <Trash width="14" height="14" />
                    </button>
                    <button
                        v-else
                        class="plugin-icon-btn"
                        title="Add"
                        :aria-label="`Add ${plugin.id}`"
                        @click="onRegister(plugin.id, plugin.dir)"
                    >
                        <Plus width="14" height="14" />
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style src="../styles/index.css"></style>
