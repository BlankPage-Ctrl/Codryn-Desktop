import { Folder, ChatBubble, Notes, Settings as SettingsIcon, Plus, Flask } from '@iconoir/vue'
import { resolveFileIconComponent } from '@/presentation/composables/useFileIcon'
import type { AppSearchItemAny, AppSearchFlag } from '@/presentation/components/app-search/types'

function flag(label: string, tone: AppSearchFlag['tone'] = 'default'): AppSearchFlag {
    return { label, tone }
}

function formatSize(size?: number): string | undefined {
    if (size == null) return undefined
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(ts?: number): string | undefined {
    if (!ts) return undefined
    const d = new Date(ts * 1000)
    return d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })
}

const DUMMY_WORKSPACES: AppSearchItemAny[] = [
    {
        id: 'ws-1',
        kind: 'workspace',
        title: 'ts-llm',
        desc: '/home/wilfredo/Project/ts-llm',
        icon: Folder,
        flags: [flag('Workspace', 'info')],
        payload: {
            id: 'ws-1',
            name: 'ts-llm',
            projectPath: '/home/wilfredo/Project/ts-llm',
            description: 'Main project',
            createdAt: '',
            updatedAt: '',
        },
    },
    {
        id: 'ws-2',
        kind: 'workspace',
        title: 'design-system',
        desc: '/home/wilfredo/Project/design-system',
        icon: Folder,
        flags: [flag('Workspace', 'info')],
        payload: {
            id: 'ws-2',
            name: 'design-system',
            projectPath: '/home/wilfredo/Project/design-system',
            description: '',
            createdAt: '',
            updatedAt: '',
        },
    },
]

const DUMMY_CHATS: AppSearchItemAny[] = [
    {
        id: 'chat-1',
        kind: 'chat',
        title: 'Explain useFloating',
        desc: 'Ask · gpt-4o',
        icon: ChatBubble,
        flags: [flag('Chat'), flag('Today', 'muted')],
        payload: {
            id: 'chat-1',
            title: 'Explain useFloating',
            workspaceId: 'ws-1',
            createdAt: '',
            updatedAt: '',
        },
    },
    {
        id: 'chat-2',
        kind: 'chat',
        title: 'Refactor AppTitle',
        desc: 'Plan · claude-3.5',
        icon: ChatBubble,
        flags: [flag('Chat'), flag('Yesterday', 'muted')],
        payload: {
            id: 'chat-2',
            title: 'Refactor AppTitle',
            workspaceId: 'ws-1',
            createdAt: '',
            updatedAt: '',
        },
    },
]

const DUMMY_NOTES: AppSearchItemAny[] = [
    {
        id: 'note-1',
        kind: 'note',
        title: 'Meeting notes — API contract',
        desc: 'Decide payload shape for palette',
        icon: Notes,
        flags: [flag('Note'), flag('High', 'info')],
        payload: {
            id: 'note-1',
            name: 'Meeting notes — API contract',
            category_id: 'cat-1',
            desc: 'Decide payload shape for palette',
            details: '',
            rank: 'a',
            priority: 'high',
            created_at: '',
            updated_at: '',
            version: 1,
        },
    },
    {
        id: 'note-2',
        kind: 'note',
        title: 'Research: VS Code palette UX',
        desc: '',
        icon: Notes,
        flags: [flag('Note'), flag('Medium', 'muted')],
        payload: {
            id: 'note-2',
            name: 'Research: VS Code palette UX',
            category_id: 'cat-1',
            desc: '',
            details: '',
            rank: 'b',
            priority: 'medium',
            created_at: '',
            updated_at: '',
            version: 1,
        },
    },
]

const DUMMY_FILES: AppSearchItemAny[] = [
    {
        id: 'file-1',
        kind: 'file',
        title: 'AppTitle.vue',
        desc: 'frontend/src/presentation/components/AppTitle.vue',
        icon: resolveFileIconComponent('AppTitle.vue', false),
        flags: [flag('File'), flag('.vue', 'muted'), flag('4.2 KB', 'muted')],
        payload: {
            id: 'file-1',
            name: 'AppTitle.vue',
            path: 'frontend/src/presentation/components/AppTitle.vue',
            type: 'file',
            isDirectory: false,
            size: 4200,
        },
    },
    {
        id: 'file-2',
        kind: 'file',
        title: 'command-palette.schema.ts',
        desc: 'frontend/src/presentation/schemas/app-search/',
        icon: resolveFileIconComponent('command-palette.schema.ts', false),
        flags: [flag('File'), flag('.ts', 'muted')],
        payload: {
            id: 'file-2',
            name: 'command-palette.schema.ts',
            path: 'frontend/src/presentation/schemas/app-search/command-palette.schema.ts',
            type: 'file',
            isDirectory: false,
            size: 1024,
        },
    },
    {
        id: 'folder-1',
        kind: 'folder',
        title: 'app-search',
        desc: 'frontend/src/presentation/components/app-search',
        icon: Folder,
        flags: [flag('Folder'), flag('Directory', 'muted')],
        payload: {
            id: 'folder-1',
            name: 'app-search',
            path: 'frontend/src/presentation/components/app-search',
            type: 'directory',
            isDirectory: true,
        },
    },
]

const DUMMY_ACTIONS: AppSearchItemAny[] = [
    {
        id: 'action-new-ws',
        kind: 'action',
        title: 'New workspace…',
        desc: 'Create a new workspace',
        icon: Plus,
        flags: [flag('Action', 'info')],
        payload: { command: 'create-workspace' },
    },
    {
        id: 'action-settings',
        kind: 'setting',
        title: 'Open Settings',
        desc: 'Preferences, providers, theme',
        icon: SettingsIcon,
        flags: [flag('Settings'), flag('⌘,', 'muted')],
        payload: { key: 'settings', label: 'Open Settings' },
    },
    {
        id: 'action-testlab',
        kind: 'action',
        title: 'Open Test Lab',
        desc: 'HITL / lab experiments',
        icon: Flask,
        flags: [flag('Action')],
        payload: { command: 'open-test-lab' },
    },
]

const ALL_DUMMY: AppSearchItemAny[] = [
    ...DUMMY_WORKSPACES,
    ...DUMMY_CHATS,
    ...DUMMY_NOTES,
    ...DUMMY_FILES,
    ...DUMMY_ACTIONS,
]

export interface CommandPaletteParams {
    query: string
    limit?: number
}

export function createCommandPaletteItems(params: CommandPaletteParams): AppSearchItemAny[] {
    const q = params.query.trim().toLowerCase()
    const limit = params.limit ?? 20

    let items = ALL_DUMMY

    if (q) {
        items = items.filter((it) => {
            const hay =
                `${it.title} ${it.desc ?? ''} ${it.kind} ${it.flags.map((f) => f.label).join(' ')}`.toLowerCase()
            return hay.includes(q)
        })
    }

    items = items.map((it) => {
        if ((it.kind === 'file' || it.kind === 'folder') && it.payload) {
            const node = it.payload as { size?: number; lastModified?: number }
            const extra: AppSearchFlag[] = []
            const sz = formatSize(node.size)
            if (sz) extra.push(flag(sz, 'muted'))
            const dt = formatDate(node.lastModified)
            if (dt) extra.push(flag(dt, 'muted'))
            if (extra.length) {
                const existing = new Set(it.flags.map((f) => f.label))
                const merged = [...it.flags, ...extra.filter((e) => !existing.has(e.label))]
                return { ...it, flags: merged }
            }
        }
        return it
    })

    return items.slice(0, limit)
}

// Dummy Page icon fallback helper (for file without ext), export for testing
export { ALL_DUMMY }
