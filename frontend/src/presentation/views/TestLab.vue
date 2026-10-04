<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
    ChatBubbleEmpty,
    Notes,
    Settings as SettingsIcon,
    Cpu,
    Menu,
    Page,
    WarningTriangle,
} from '@iconoir/vue'
import { ContainerGrid } from '@/presentation/components/container'
import type { ContainerSchema } from '@/presentation/components/container'
import TestHitl from './TestHitl.vue'

type TestItem = {
    id: string
    label: string
    icon: unknown
}

const router = useRouter()

const testItems: [TestItem, ...TestItem[]] = [
    { id: 'chat-input', label: 'Chat Input Test', icon: ChatBubbleEmpty },
    { id: 'hitl', label: 'HITL Test', icon: WarningTriangle },
    { id: 'notes', label: 'Notes Test', icon: Notes },
    { id: 'providers', label: 'Provider Test', icon: Cpu },
    { id: 'settings', label: 'Settings Test', icon: SettingsIcon },
]

const sidebarCollapsed = ref(false)
const activeId = ref<string>(testItems[0].id)

function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
}

function select(id: string) {
    activeId.value = id
    sidebarCollapsed.value = false
}

const activeItem = computed(() => testItems.find((i) => i.id === activeId.value) ?? testItems[0])

const layout = computed<ContainerSchema[]>(() => [
    {
        id: 'test-row',
        height: '1fr',
        columns: [
            {
                id: 'sidebar',
                width: 240,
                visible: !sidebarCollapsed.value,
                resizable: true,
                minWidth: 180,
                maxWidth: 360,
                cell: {
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    borderWidth: '0 1px 0 0',
                    borderStyle: 'solid',
                    padding: 12,
                    overflow: 'auto',
                },
            },
            {
                id: 'content',
                width: '1fr',
                cell: {
                    background: 'var(--bg-primary)',
                    padding: 24,
                    overflow: 'auto',
                },
            },
        ],
    },
])
</script>

<template>
    <div style="height: 100%">
        <ContainerGrid :schema="layout" :animate="true" :animation-ms="180">
            <template #sidebar>
                <div class="testlab__sidebar">
                    <div class="testlab__sidebar-head">
                        <span class="testlab__brand">
                            <Page width="18" height="18" />
                            Test Lab
                        </span>
                        <button
                            type="button"
                            class="testlab__toggle"
                            title="Toggle sidebar"
                            @click="toggleSidebar"
                        >
                            <Menu width="18" height="18" />
                        </button>
                    </div>
                    <nav class="testlab__nav">
                        <button
                            v-for="item in testItems"
                            :key="item.id"
                            type="button"
                            class="testlab__nav-item"
                            :class="{ 'testlab__nav-item--active': item.id === activeId }"
                            @click="select(item.id)"
                        >
                            <component :is="item.icon" width="18" height="18" />
                            <span>{{ item.label }}</span>
                        </button>
                    </nav>
                </div>
            </template>

            <template #content>
                <div class="testlab__content">
                    <header class="testlab__content-head">
                        <component :is="activeItem.icon" width="22" height="22" />
                        <h1 class="testlab__title">{{ activeItem.label }}</h1>
                    </header>
                    <p class="testlab__subtitle">
                        Dummy page for <code>{{ activeItem.id }}</code
                        >. This is just a placeholder — wire the real test UI here later.
                    </p>
                    <TestHitl v-if="activeId === 'hitl'" />
                    <div v-else class="testlab__placeholder">
                        <div class="testlab__placeholder-card">
                            <span class="testlab__placeholder-badge">DUMMY</span>
                            <p>{{ activeItem.label }} content goes here.</p>
                            <button
                                type="button"
                                class="testlab__back"
                                @click="router.push({ name: 'home' })"
                            >
                                Back to Workspace
                            </button>
                        </div>
                    </div>
                </div>
            </template>
        </ContainerGrid>
    </div>
</template>

<style scoped>
.testlab__sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 12px;
}

.testlab__sidebar-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.testlab__brand {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-serif);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
}

.testlab__toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--bg-primary);
    color: var(--text-primary);
    cursor: pointer;
}

.testlab__toggle:hover {
    background: var(--bg-tertiary, var(--bg-secondary));
}

.testlab__nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.testlab__nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--text-primary);
    opacity: 0.7;
    font-size: var(--type-sm);
    text-align: left;
    cursor: pointer;
}

.testlab__nav-item:hover {
    background: var(--bg-tertiary, var(--bg-primary));
    opacity: 1;
}

.testlab__nav-item--active {
    background: var(--bg-primary);
    opacity: 1;
    font-weight: var(--font-weight-medium);
}

.testlab__content {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.testlab__content-head {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-primary);
}

.testlab__title {
    font-family: var(--font-serif);
    font-size: var(--type-xl);
    font-weight: var(--font-weight-semibold);
    margin: 0;
    color: var(--text-primary);
}

.testlab__subtitle {
    margin: 6px 0 24px;
    color: var(--text-primary);
    opacity: 0.55;
    font-size: var(--type-sm);
}

.testlab__subtitle code {
    background: var(--bg-secondary);
    padding: 1px 5px;
    border-radius: 5px;
}

.testlab__placeholder {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.testlab__placeholder-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 40px 56px;
    border: 1px dashed var(--border-color);
    border-radius: 14px;
    text-align: center;
    color: var(--text-primary);
    opacity: 0.8;
}

.testlab__placeholder-badge {
    font-size: 11px;
    letter-spacing: 0.12em;
    padding: 3px 8px;
    border-radius: 999px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    opacity: 0.6;
}

.testlab__back {
    padding: 8px 16px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    cursor: pointer;
}

.testlab__back:hover {
    background: var(--bg-tertiary, var(--bg-primary));
}
</style>
