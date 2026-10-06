<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Album, EmojiPuzzled, ChatBubbleEmpty, Folder, Notes, Plus, Settings as SettingsIcon } from '@iconoir/vue'
import { useDialog } from '@/presentation/composables/useDialog'
import { AppList } from '@/presentation/components/list'
import {
    useWorkspaceStorer,
    useChatStorer,
    useProviderStorer,
    useAppearanceStorer,
    useThemeStorer,
    useNoteStorer,
    useChatSessionStorer,
    useFileExplorerStorer,
    useHitlStorer,
    createEmptyChatSessionState,
} from '@/application/stores'
import {
    workspaceActions,
    attachmentActions,
    chatActions,
    providerActions,
    fileExplorerActions,
    appearanceActions,
    themeActions,
    noteActions,
    chatSessionActions,
    hitlActions,
    insightActions,
    mcpActions,
} from '@/application/actions'
import type { Chat, ChatMode, Note, RevertPreviewState } from '@/core/entities'
import { APPEARANCE_PRESETS } from '@/core/entities'
import type { AttachedImage } from '@/presentation/components/chat/types/attachment'
import { MAX_IMAGES_PER_MESSAGE } from '@/presentation/components/chat/types/attachment'
import ChatTab from '@/presentation/components/chat/ChatTab.vue'
import type { ChatTabSchema } from '@/presentation/components/chat/types/schema'
import NotesTab from '@/presentation/components/notes/NotesTab.vue'
import type { NotesTabSchema } from '@/presentation/components/notes'
import SettingsTab from '@/presentation/components/settings/SettingsTab.vue'
import type {
    SettingsTabSchema,
    SettingsTheme,
} from '@/presentation/components/settings/types/schema'
import type { DynamicGridDataOutput } from '@/presentation/components/dialog/types'
import { useSettingsTab } from '@/presentation/composables/useSettingsTab'
import { ContainerGrid } from '@/presentation/components/container'
import { TabStrip } from '@/presentation/components/tabs'
import type { TabStripSchema as WsTabStripSchema } from '@/presentation/components/tabs'
import { useSidebarKeyboard } from '@/presentation/composables/useSidebarKeyboard'
import { useShellExec } from '@/presentation/composables/useShellExec'
import { useTabs } from '@/presentation/composables/useTabs'
import { FileExplorer } from '@/presentation/components/file-explorer'
import { NoteGroup } from '@/presentation/components/note-group'
import {
    chatFormSchema,
    createProviderFormSchema,
    modelFormSchema,
    categoryFormSchema,
    createSidebarChatListSchema,
    createSidebarNoteListSchema,
    createChatTabSchema,
    createHitlDockSchema,
    createNotesTabSchema,
    createWorkspaceLayout,
    createSettingsTabSchema,
} from '@/presentation/schemas'
import { createMentionItemsFromFiles } from '@/presentation/schemas/mention'

const SETTINGS_TAB_ID = '__settings__'

type TabMeta =
    | { kind: 'chat'; chatId: string }
    | { kind: 'settings' }
    | { kind: 'note'; noteId: string }

function chatTabMeta(chatId: string): TabMeta {
    return { kind: 'chat', chatId }
}

function noteTabMeta(noteId: string): TabMeta {
    return { kind: 'note', noteId }
}

const route = useRoute()
const router = useRouter()
const wsStorer = useWorkspaceStorer()
const chatStorer = useChatStorer()
const providerStorer = useProviderStorer()
const appearanceStorer = useAppearanceStorer()
const themeStorer = useThemeStorer()
const noteStorer = useNoteStorer()
const dialog = useDialog()
const settingsTab = useSettingsTab()
const chatSessionStorer = useChatSessionStorer()
const fileExplorerStorer = useFileExplorerStorer()
const hitlStorer = useHitlStorer()

const mentionQuery = ref('')
const mentionLoading = ref(false)

// Revert-message drafts, keyed by chat. Set by beginEdit (runs keep going),
// cleared by Cancel or by Send (which cancels the live run and restarts).
const pendingEdits = ref<Record<string, { messageId: string; text: string }>>({})

// Revert previews for the active drafts, keyed by chat. Fetched once when
// the draft opens; advisory only (the file can change while the draft is
// open - the sendEdit result is authoritative).
const editPreviews = ref<Record<string, RevertPreviewState>>({})

// Composer image attachments, keyed by chat. Uploaded immediately on pick
// (pending -> linked flips server-side on send); send is blocked until every
// item is ready, so a failed upload must be removed or retried first.
const attachedImagesByChat = ref<Record<string, AttachedImage[]>>({})

function attachedImagesFor(chatId: string): AttachedImage[] {
    return attachedImagesByChat.value[chatId] ?? []
}

async function onPickImages(chatId: string) {
    const wsId = workspaceId.value
    if (!wsId) return
    let picked: Array<{
        filename: string
        mediaType: string
        dataBase64: string
        sizeBytes: number
    }>
    try {
        picked = await attachmentActions.pickImages()
    } catch {
        return
    }
    if (picked.length === 0) return
    const list = (attachedImagesByChat.value[chatId] ??= [])
    for (const p of picked) {
        if (list.length >= MAX_IMAGES_PER_MESSAGE) break
        const item = reactive<AttachedImage>({
            localId: crypto.randomUUID(),
            filename: p.filename,
            mediaType: p.mediaType,
            sizeBytes: p.sizeBytes,
            previewUrl: `data:${p.mediaType};base64,${p.dataBase64}`,
            status: 'uploading',
        })
        list.push(item)
        try {
            const res = await withUploadTimeout(
                attachmentActions.uploadAttachment(wsId, {
                    filename: p.filename,
                    mediaType: p.mediaType,
                    dataBase64: p.dataBase64,
                }),
            )
            // The composer list may have been cleared (sent) while uploading.
            if (!attachedImagesByChat.value[chatId]?.includes(item)) continue
            item.attachmentId = res.attachment.id
            item.status = 'ready'
        } catch (e: unknown) {
            item.status = 'error'
            item.error = e instanceof Error ? e.message : 'Upload failed'
        }
    }
}

function onRemoveImage(chatId: string, localId: string) {
    const list = attachedImagesByChat.value[chatId]
    if (!list) return
    attachedImagesByChat.value[chatId] = list.filter((img) => img.localId !== localId)
}

// Bounds an upload so a lost bridge response can never spin forever.
// Must exceed the Go HTTP client timeout (30s) to avoid racing it.
const UPLOAD_TIMEOUT_MS = 35000

function withUploadTimeout<T>(promise: Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined
    return new Promise<T>((resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Upload timed out')), UPLOAD_TIMEOUT_MS)
        promise.then(
            (value) => {
                if (timer !== undefined) clearTimeout(timer)
                resolve(value)
            },
            (err: unknown) => {
                if (timer !== undefined) clearTimeout(timer)
                reject(err)
            },
        )
    })
}

const mentionItems = computed(() =>
    createMentionItemsFromFiles({
        query: mentionQuery.value,
        nodes: fileExplorerStorer.searchResults,
        workspaceRoot: fileExplorerStorer.workspaceRoot,
        maxResults: 12,
    }),
)

async function onMentionSearch(query: string) {
    mentionQuery.value = query
    if (!query.trim()) {
        fileExplorerStorer.setSearchResults([])
        return
    }
    mentionLoading.value = true
    try {
        await fileExplorerActions.searchFiles(query)
    } finally {
        mentionLoading.value = false
    }
}

const routeWsId = computed(() => route.params.id as string | undefined)

const workspaceId = computed(() => {
    return routeWsId.value || wsStorer.selectedWorkspaceId || ''
})

useShellExec(workspaceId)

onMounted(() => {
    void hitlActions.seedPending()
    hitlActions.startWatch()
})

const workspace = computed(() => {
    if (!workspaceId.value) return null
    return wsStorer.workspaces.find((w) => w.id === workspaceId.value) ?? null
})

const sidebarCollapsed = ref(false)
const sidebarPanelWidth = ref(240)
const showFileExplorer = ref(false)
const showNotes = ref(false)

useSidebarKeyboard(() => {
    sidebarCollapsed.value = !sidebarCollapsed.value
})

function showPanel(view: 'chat' | 'files' | 'notes') {
    showFileExplorer.value = view === 'files'
    showNotes.value = view === 'notes'
    sidebarCollapsed.value = false
}

const workspaceSchema = computed(() =>
    createWorkspaceLayout({
        panelWidth: sidebarPanelWidth.value,
        collapsed: sidebarCollapsed.value,
    }),
)

const {
    order: openChatIds,
    activeId: activeChatId,
    activeMeta,
    isOpen,
    open,
    close,
    reset,
    getMeta,
} = useTabs<string, TabMeta>()

watch(
    () => settingsTab.requestCount,
    () => {
        if (workspace.value) open(SETTINGS_TAB_ID, { kind: 'settings' })
    },
)

const activeChat = computed(() => {
    const meta = activeMeta.value
    if (!meta || meta.kind !== 'chat') return null
    return getChatById(meta.chatId)
})

// Memoized so the template does not rebuild a fresh schema object (with
// fresh closures) on every render. The schema still refreshes whenever any
// of its reactive inputs change, including each stream frame.
const activeChatTabSchema = computed<ChatTabSchema | null>(() => {
    const chat = activeChat.value
    if (!chat) return null
    return buildChatTabSchema(chat)
})

const activeNote = computed(() => {
    const meta = activeMeta.value
    if (!meta || meta.kind !== 'note') return null
    return getNoteById(meta.noteId)
})

type ContentView =
    | { type: 'chat'; chatId: string }
    | { type: 'settings' }
    | { type: 'note'; noteId: string }
    | { type: 'none' }

const contentView = computed<ContentView>(() => {
    const meta = activeMeta.value
    if (meta?.kind === 'settings') return { type: 'settings' }
    if (meta?.kind === 'chat') return { type: 'chat', chatId: meta.chatId }
    if (meta?.kind === 'note') return { type: 'note', noteId: meta.noteId }
    return { type: 'none' }
})

watch(activeChatId, (newId) => {
    const meta = activeMeta.value
    if (newId && newId !== SETTINGS_TAB_ID && meta?.kind === 'chat') {
        chatSessionActions.loadHistory(workspaceId.value, newId)
    }
})

const WsTabStripSchema = computed<WsTabStripSchema<string>>(() => {
    const tabs = openChatIds.value
        .filter((id) => id !== SETTINGS_TAB_ID)
        .map((id) => {
            const meta = getMeta(id)
            if (meta?.kind === 'note') {
                const note = getNoteById(id)
                return {
                    id,
                    title: note?.name ?? 'Untitled note',
                    icon: Notes,
                    closable: true,
                }
            }
            return {
                id,
                title: getChatById(id)?.title ?? 'Untitled chat',
                icon: ChatBubbleEmpty,
                closable: true,
            }
        })

    if (isOpen(SETTINGS_TAB_ID)) {
        tabs.push({
            id: SETTINGS_TAB_ID,
            title: 'Settings',
            icon: SettingsIcon,
            closable: true,
        })
    }

    return {
        tabs,
        activeId: activeChatId.value,
        closable: true,
        onSelect: (id) => open(id),
        onClose: (id) => close(id),
    }
})

function buildHitlDockSchema(chatId: string) {
    return createHitlDockSchema({
        items: hitlStorer.pendingForChat(chatId),
        onApprove: (id, always) => {
            void hitlActions.submit(id, { outcome: always ? 'always_approved' : 'approved' })
        },
        onApproveWithModification: (id, modificationNote) => {
            void hitlActions.submit(id, { outcome: 'approved_with_modification', modificationNote })
        },
        onDeny: (id, reason) => {
            void hitlActions.submit(id, {
                outcome: 'rejected',
                ...(reason ? { reason } : {}),
            })
        },
        onAskSubmit: (id, value) => {
            void hitlActions.submit(id, { value })
        },
        onChoiceSubmit: (id, selected, customInput) => {
            void hitlActions.submit(id, {
                selected,
                ...(customInput ? { customInput } : {}),
            })
        },
        onDismiss: (id) => {
            void hitlActions.dismiss(id)
        },
    })
}

function buildChatTabSchema(chat: Chat): ChatTabSchema {
    const pending = pendingEdits.value[chat.id]
    return createChatTabSchema({
        chat,
        hitl: buildHitlDockSchema(chat.id),
        resolveAttachmentUrl: async (attachmentId) => {
            const wsId = workspaceId.value
            if (!wsId) return null
            try {
                return await attachmentActions.getAttachmentDataURL(wsId, attachmentId)
            } catch {
                return null
            }
        },
        state: chatSessionStorer.sessions[chat.id] ?? createEmptyChatSessionState(),
        providers: providerStorer.providers,
        contentWidth: appearanceStorer.contentWidth,
        fontSize: appearanceStorer.fontSize,
        lineHeight: appearanceStorer.lineHeight,
        mentionItems: mentionItems.value,
        mentionLoading: mentionLoading.value,
        attachedImages: attachedImagesFor(chat.id),
        onPickImages: () => void onPickImages(chat.id),
        onRemoveImage: (localId) => onRemoveImage(chat.id, localId),
        draftText: pending?.text,
        revertPreview: editPreviews.value[chat.id] ?? null,
        onToggleRestoreFiles: (enabled: boolean) => {
            const current = editPreviews.value[chat.id]
            if (current) editPreviews.value[chat.id] = { ...current, restoreFiles: enabled }
        },
        onSend: (text) => {
            if (pending) {
                const { messageId } = pending
                const restoreFiles = editPreviews.value[chat.id]?.restoreFiles ?? true
                // Keep the draft until sendEdit reports success - on failure
                // the composer keeps the text so the user can retry.
                void chatSessionActions
                    .sendEdit(workspaceId.value, chat.id, messageId, text, { restoreFiles })
                    .then((result) => {
                        if (result.ok) {
                            delete pendingEdits.value[chat.id]
                            delete editPreviews.value[chat.id]
                        }
                    })
                return
            }
            // Block-all: only ready uploads are sent, and only when nothing
            // is still uploading or failed (the composer disables Send then).
            const ready = attachedImagesFor(chat.id).filter(
                (img) => img.status === 'ready' && img.attachmentId,
            )
            if (attachedImagesFor(chat.id).length !== ready.length) return
            if (!text.trim() && ready.length === 0) return
            delete attachedImagesByChat.value[chat.id]
            void chatSessionActions.sendMessage(
                workspaceId.value,
                chat.id,
                text,
                ready.map((img) => ({
                    attachmentId: img.attachmentId ?? '',
                    mediaType: img.mediaType,
                    filename: img.filename,
                    previewUrl: img.previewUrl,
                })),
            )
        },
        onStop: () => chatSessionActions.stop(chat.id),
        onCancelEdit: () => {
            delete pendingEdits.value[chat.id]
            delete editPreviews.value[chat.id]
        },
        onEditMessage: (messageId) => {
            const text = chatSessionActions.beginEdit(chat.id, messageId)
            if (text == null) return
            pendingEdits.value[chat.id] = { messageId, text }
            // Preview is advisory: loading state, then the plan (or error).
            // A failed preview just hides the file section of the banner.
            editPreviews.value[chat.id] = { status: 'loading', restoreFiles: true }
            void chatSessionActions
                .previewEdit(workspaceId.value, chat.id, messageId)
                .then((preview) => {
                    // The draft may have been cancelled/sent meanwhile.
                    if (pendingEdits.value[chat.id]?.messageId !== messageId) return
                    editPreviews.value[chat.id] =
                        preview == null
                            ? { status: 'error', restoreFiles: true }
                            : { status: 'ready', preview, restoreFiles: true }
                })
        },
        onDismissError: () => chatSessionActions.dismissError(chat.id),
        onUpdateModel: (modelId, providerId) => onUpdateChat(chat.id, { modelId, providerId }),
        onChangeThinkingMode: (thinkingMode) => onUpdateChat(chat.id, { thinkingMode }),
        onChangeMode: (mode) => onUpdateChat(chat.id, { mode }),
        onMentionSearch: onMentionSearch,
    })
}

function getChatById(chatId: string): Chat | undefined {
    return chatStorer.chats.find((c) => c.id === chatId)
}

async function onUpdateChat(
    chatId: string,
    payload: { modelId?: string; providerId?: string; thinkingMode?: string; mode?: ChatMode },
) {
    try {
        await chatActions.updateChat(workspaceId.value, chatId, payload)
    } catch {
        /* handled by logic */
    }
}

async function openChatCreate() {
    await dialog.spawn({
        title: 'New chat',
        schema: chatFormSchema,
        confirmLabel: 'Create',
        submit: async (data) => {
            await chatActions.createChat(workspaceId.value, {
                title: String(data.chat!.title ?? ''),
            })
        },
    })
}

const chatListSchema = computed(() =>
    createSidebarChatListSchema({
        activeChatId: activeChatId.value ?? undefined,
        onSelect: (chat) => {
            open(chat.id, chatTabMeta(chat.id))
        },
        onEdit: openChatEdit,
        onDelete: confirmDeleteChat,
        onCreate: openChatCreate,
    }),
)

async function openChatEdit(chat: Chat) {
    await dialog.spawn({
        title: 'Edit chat',
        schema: chatFormSchema,
        initialData: { chat: { title: chat.title } },
        confirmLabel: 'Save',
        submit: async (data) => {
            await chatActions.updateChat(workspaceId.value, chat.id, {
                title: String(data.chat!.title ?? ''),
            })
        },
    })
}

async function confirmDeleteChat(chat: Chat) {
    await dialog.spawn({
        title: 'Delete chat',
        message: `Delete "${chat.title}"?`,
        confirmLabel: 'Delete',
        confirmVariant: 'danger',
        submit: async () => {
            if (isOpen(chat.id)) {
                close(chat.id)
            }
            chatSessionActions.dispose(chat.id)
            await chatActions.deleteChat(workspaceId.value, chat.id)
        },
    })
}

function getNoteById(noteId: string): Note | undefined {
    return noteStorer.notes.find((n) => n.id === noteId)
}

const noteGroups = computed(() => {
    const cats = noteStorer.categories
    const map = new Map<string, Note[]>()
    for (const note of noteStorer.notes) {
        const key = note.category_id || '__uncategorized__'
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(note)
    }
    return [...map.entries()].map(([categoryId, notes]) => ({
        id: categoryId,
        name: cats.find((c) => c.id === categoryId)?.name ?? 'Uncategorized',
        notes,
    }))
})

const activeNoteId = computed(() => {
    const meta = activeMeta.value
    return meta?.kind === 'note' ? meta.noteId : undefined
})

const noteListSchema = computed(() =>
    createSidebarNoteListSchema({
        activeNoteId: activeNoteId.value,
        onSelect: (note) => {
            open(note.id, noteTabMeta(note.id))
        },
        onDelete: confirmDeleteNote,
        onCreate: openNoteCreate,
    }),
)

async function openNoteCreate() {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    noteActions.upsertLocalNote({
        id,
        name: 'Untitled',
        desc: '',
        details: '',
        category_id: '',
        priority: 'medium',
        rank: '',
        created_at: now,
        updated_at: now,
        version: 1,
    })
    draftNoteIds.value.add(id)
    autofocusNameId.value = id
    showPanel('notes')
    open(id, noteTabMeta(id))
}

function applyLocalNotePatch(noteId: string, patch: Partial<Note>) {
    const current = noteStorer.notes.find((n) => n.id === noteId)
    if (!current) return
    noteActions.upsertLocalNote({
        ...current,
        ...patch,
        updated_at: new Date().toISOString(),
    })
}

async function persistDraft(noteId: string) {
    const draft = noteStorer.notes.find((n) => n.id === noteId)
    if (!draft) return
    savingNote.value = true
    let realId: string
    try {
        realId = await noteActions.createNote(workspaceId.value, {
            name: draft.name.trim() || 'Untitled',
            desc: draft.desc,
            details: draft.details,
            priority: draft.priority,
        })
    } finally {
        savingNote.value = false
    }
    noteActions.removeLocalNote(noteId)
    draftNoteIds.value.delete(noteId)
    if (autofocusNameId.value === noteId) autofocusNameId.value = null
    close(noteId)
    open(realId, noteTabMeta(realId))
}

async function confirmDeleteNote(note: Note) {
    await dialog.spawn({
        title: 'Delete note',
        message: `Delete "${note.name}"?`,
        confirmLabel: 'Delete',
        confirmVariant: 'danger',
        submit: async () => {
            if (isOpen(note.id)) {
                close(note.id)
            }
            await noteActions.deleteNote(workspaceId.value, note.id)
        },
    })
}

const autofocusNameId = ref<string | null>(null)
const draftNoteIds = ref<Set<string>>(new Set())
const pendingSaves = new Map<string, Record<string, unknown>>()
let saveTimer: ReturnType<typeof setTimeout> | null = null
let saveInterval: ReturnType<typeof setInterval> | null = null
const savingNote = ref(false)
const lastSavedAt = ref<number | null>(null)

function queueSave(noteId: string, patch: Record<string, unknown>) {
    const existing = pendingSaves.get(noteId) ?? {}
    pendingSaves.set(noteId, { ...existing, ...patch })
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
        flushSaves()
    }, 3000)
}

async function flushSaves() {
    if (saveTimer) {
        clearTimeout(saveTimer)
        saveTimer = null
    }
    if (!pendingSaves.size) return
    const entries = [...pendingSaves.entries()]
    pendingSaves.clear()
    savingNote.value = true
    for (const [id, patch] of entries) {
        const current = noteStorer.notes.find((n) => n.id === id)
        if (!current) continue
        try {
            await noteActions.updateNote(workspaceId.value, id, {
                ...patch,
                version: current.version,
            })
        } catch {
            /* handled by logic */
        }
    }
    savingNote.value = false
    lastSavedAt.value = Date.now()
}

function buildNotesTabSchema(note: Note): NotesTabSchema {
    const isDraft = draftNoteIds.value.has(note.id)
    return createNotesTabSchema({
        note,
        categories: noteStorer.categories,
        saving: savingNote.value,
        savedAt: lastSavedAt.value ? new Date(lastSavedAt.value).toISOString() : null,
        autofocusName: note.id === autofocusNameId.value,
        onNameCommit: (name) => {
            if (autofocusNameId.value === note.id) autofocusNameId.value = null
            if (isDraft) applyLocalNotePatch(note.id, { name })
            else queueSave(note.id, { name })
        },
        onDescCommit: (desc) => {
            if (isDraft) applyLocalNotePatch(note.id, { desc })
            else queueSave(note.id, { desc })
        },
        onDetailsCommit: (details) => {
            if (isDraft) applyLocalNotePatch(note.id, { details })
            else queueSave(note.id, { details })
        },
        onPriorityChange: (priority) => {
            if (isDraft) applyLocalNotePatch(note.id, { priority })
            else queueSave(note.id, { priority })
        },
        onCategoryChange: (categoryId) => {
            if (isDraft) applyLocalNotePatch(note.id, { category_id: categoryId })
            else queueSave(note.id, { category_id: categoryId })
        },
        onCreateCategory: () => openCategoryCreate(note),
        onSave: async () => {
            if (isDraft) {
                await persistDraft(note.id)
            } else {
                flushSaves()
            }
        },
    })
}

async function openCategoryCreate(note?: Note) {
    await dialog.spawn({
        title: 'New category',
        schema: categoryFormSchema,
        confirmLabel: 'Create',
        submit: async (data) => {
            const name = String(data.category!.name ?? '')
            const id = await noteActions.createCategory(workspaceId.value, { name })
            if (note) {
                if (draftNoteIds.value.has(note.id)) {
                    applyLocalNotePatch(note.id, { category_id: id })
                } else {
                    queueSave(note.id, { category_id: id })
                }
            }
        },
    })
}

function onFileToggle(path: string) {
    fileExplorerActions.toggleExpand(path)
}

function onFileSelect(path: string | null) {
    fileExplorerActions.select(path)
}

function onFileSearchInput(query: string) {
    fileExplorerActions.searchFiles(query)
}

function onFileSearchSelect(path: string) {
    console.log('[FileExplorer search] selected:', path)
}

const settingsThemes = computed<SettingsTheme[]>(() =>
    themeStorer.availableThemes.map((t) => ({
        ...t,
        swatches: themePreviewColors(t.id),
    })),
)

function themePreviewColors(id: string): string[] {
    const colors = themeActions.getThemePreview(id)
    if (!colors) return []
    return [
        normalizeRgb(colors.bgPrimary),
        normalizeRgb(colors.bgSecondary),
        normalizeRgb(colors.border),
        normalizeRgb(colors.textPrimary),
    ]
}

function normalizeRgb(rgb: string): string {
    const parts = rgb.split(',').map((s) => s.trim())
    return `rgb(${parts.join(',')})`
}

async function handleAddProvider() {
    await dialog.spawn({
        title: 'Add provider',
        schema: createProviderFormSchema(providerStorer.providerTypes),
        confirmLabel: 'Create',
        submit: async (data: DynamicGridDataOutput) => {
            const row = data.row!
            await providerActions.createProvider({
                name: String(row.name ?? ''),
                type: String(row.type ?? 'openai'),
                apiKey: row.apiKey ? String(row.apiKey) : undefined,
                baseURL: row.baseURL ? String(row.baseURL) : undefined,
            })
        },
    })
}

async function handleEditProvider(provider: {
    id: string
    name: string
    type: string
    apiKey?: string
    baseURL?: string
}) {
    await dialog.spawn({
        title: 'Edit provider',
        schema: createProviderFormSchema(providerStorer.providerTypes),
        initialData: {
            row: {
                name: provider.name,
                type: provider.type,
                apiKey: provider.apiKey ?? '',
                baseURL: provider.baseURL ?? '',
            },
        },
        confirmLabel: 'Save',
        submit: async (data: DynamicGridDataOutput) => {
            const row = data.row!
            await providerActions.updateProvider(provider.id, {
                name: String(row.name ?? ''),
                type: String(row.type ?? 'openai'),
                apiKey: row.apiKey ? String(row.apiKey) : undefined,
                baseURL: row.baseURL ? String(row.baseURL) : undefined,
            })
        },
    })
}

async function handleAddModel(providerId: string) {
    await dialog.spawn({
        title: 'New model',
        schema: modelFormSchema,
        confirmLabel: 'Create',
        submit: async (data: DynamicGridDataOutput) => {
            const row = data.row!
            await providerActions.createModel(providerId, {
                modelId: String(row.modelId ?? ''),
                displayName: row.displayName ? String(row.displayName) : undefined,
                maxInputTokens: toOptionalPositiveInt(row.maxInputTokens),
                maxOutputTokens: toOptionalPositiveInt(row.maxOutputTokens),
            })
        },
    })
}

function toOptionalPositiveInt(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined
    const n = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(n) || n < 1) return undefined
    return Math.floor(n)
}

async function handleEditModel(
    providerId: string,
    modelId: string,
    data: {
        modelId: string
        displayName?: string
        maxInputTokens?: number
        maxOutputTokens?: number
    },
) {
    await providerActions.updateModel(providerId, modelId, {
        modelId: data.modelId,
        displayName: data.displayName,
        maxInputTokens: data.maxInputTokens ?? undefined,
        maxOutputTokens: data.maxOutputTokens ?? undefined,
    })
}

function buildSettingsTabSchema(): SettingsTabSchema {
    return createSettingsTabSchema({
        providers: providerStorer.providers,
        loading: providerStorer.loading,
        error: providerStorer.error,
        defaultProviderId: providerStorer.defaultProviderId,
        defaultModelId: providerStorer.defaultModelId,
        preset: appearanceStorer.preset,
        fontSize: appearanceStorer.fontSize,
        themes: settingsThemes.value,
        activeThemeId: themeStorer.activeThemeId,
        presets: APPEARANCE_PRESETS,
        terminalAnimated: appearanceStorer.terminalAnimated,
        onAddProvider: handleAddProvider,
        onEditProvider: handleEditProvider,
        onDeleteProvider: handleDeleteProvider,
        onAddModel: handleAddModel,
        onEditModel: handleEditModel,
        onDeleteModel: handleDeleteModel,
        onSetDefault: handleSetDefault,
        onUpdatePreset: handleUpdatePreset,
        onUpdateFontSize: handleUpdateFontSize,
        onSetActiveTheme: handleSetActiveTheme,
        onToggleTerminalAnimated: handleToggleTerminalAnimated,
    })
}

async function handleDeleteModel(providerId: string, modelId: string) {
    await providerActions.deleteModel(providerId, modelId)
}

async function handleSetDefault(providerId: string, modelId: string) {
    await providerActions.setDefaultProvider(providerId, modelId)
}

async function handleDeleteProvider(id: string) {
    await providerActions.deleteProvider(id)
}

function cleanupWorkspace() {
    chatSessionActions.clear()
    fileExplorerActions.stopWatch()
    flushSaves()
    stopAutoSaveInterval()
}

function handleUpdatePreset(preset: string) {
    appearanceActions.setPreset(preset)
}

function handleUpdateFontSize(size: number) {
    appearanceActions.setFontSize(size)
}

function handleSetActiveTheme(id: string) {
    themeActions.setTheme(id)
}

function handleToggleTerminalAnimated(v: boolean) {
    appearanceActions.setTerminalAnimated(v)
}

watch(routeWsId, (id) => {
    if (id && id !== wsStorer.selectedWorkspaceId) {
        workspaceActions.selectWorkspace(id)
    }
})

watch(
    () => wsStorer.selectedWorkspaceId,
    (id) => {
        if (id && route.name === 'home' && !routeWsId.value) {
            router.replace({ name: 'workspace', params: { id } })
        }
    },
)

watch(
    workspaceId,
    async (newId, oldId) => {
        if (!newId) {
            cleanupWorkspace()
            void insightActions.ensureOnSelect(null)
            void mcpActions.refreshOnSelect(null)
            return
        }

        if (newId === oldId) return

        cleanupWorkspace()
        reset()
        await chatActions.fetchChats(newId)
        providerActions.fetchProviders()
        noteActions.fetchNotes(newId)
        noteActions.fetchCategories(newId)
        void insightActions.ensureOnSelect(newId)
        void mcpActions.refreshOnSelect(newId)
        startAutoSaveInterval()

        const ws = wsStorer.workspaces.find((w) => w.id === newId)
        fileExplorerActions.loadRoot(newId, ws ? { workspaceRoot: ws.projectPath } : undefined)
        fileExplorerActions.startWatch(newId)

        const chatId = route.query.chat as string | undefined
        if (chatId && chatStorer.chats.some((c) => c.id === chatId)) {
            open(chatId, chatTabMeta(chatId))
        }
    },
    { immediate: true },
)

watch(activeMeta, (meta, oldMeta) => {
    const wasNote = oldMeta?.kind === 'note'
    const isNote = meta?.kind === 'note'
    if (wasNote || (!isNote && pendingSaves.size)) {
        flushSaves()
    }
})

function startAutoSaveInterval() {
    if (saveInterval) return
    saveInterval = setInterval(() => {
        if (pendingSaves.size) flushSaves()
    }, 30_000)
}

function stopAutoSaveInterval() {
    if (saveInterval) {
        clearInterval(saveInterval)
        saveInterval = null
    }
}

onBeforeUnmount(() => {
    flushSaves()
    stopAutoSaveInterval()
})

onUnmounted(() => {
    hitlActions.stopWatch()
    cleanupWorkspace()
})
</script>

<template>
    <div class="ws-layout" v-if="workspace">
        <ContainerGrid :schema="workspaceSchema" :animate="true">
            <template #panel>
                <div class="ws-sidebar__panel">
                    <div class="ws-panel-nav">
                        <div
                            class="ws-panel-group"
                            :class="{ 'ws-panel-group--active': !showFileExplorer && !showNotes }"
                        >
                            <button
                                type="button"
                                class="ws-panel-main"
                                :aria-pressed="!showFileExplorer && !showNotes"
                                title="Chat"
                                @click="showPanel('chat')"
                            >
                                <ChatBubbleEmpty width="14" height="14" />
                                <span>Chat</span>
                            </button>
                            <button
                                type="button"
                                class="ws-panel-add"
                                title="New chat"
                                aria-label="New chat"
                                @click="openChatCreate"
                            >
                                <Plus width="14" height="14" />
                            </button>
                        </div>

                        <div
                            class="ws-panel-group"
                            :class="{ 'ws-panel-group--active': showNotes }"
                        >
                            <button
                                type="button"
                                class="ws-panel-main"
                                :aria-pressed="showNotes"
                                title="Notes"
                                @click="showPanel('notes')"
                            >
                                <Notes width="14" height="14" />
                                <span>Notes</span>
                            </button>
                            <button
                                type="button"
                                class="ws-panel-add"
                                title="New note"
                                aria-label="New note"
                                @click="openNoteCreate"
                            >
                                <Plus width="14" height="14" />
                            </button>
                        </div>

                        <button
                            typews-panel-single="button"
                            class="ws-panel-single"
                            :class="{ 'ws-panel-single--active': showFileExplorer }"
                            :aria-pressed="showFileExplorer"
                            title="File Explorer"
                            @click="showPanel('files')"
                        >
                            <Folder width="14" height="14" />
                            <span>File Explorer</span>
                        </button>
                    </div>
                    <div class="ws-sidebar__body">
                        <AppList
                            v-if="!showFileExplorer && !showNotes"
                            :schema="chatListSchema"
                            :items="chatStorer.chats"
                        />
                        <div v-else-if="!showFileExplorer && showNotes" class="ws-note-groups">
                            <div v-if="!noteStorer.notes.length" class="ws-note-groups__empty">
                                No notes yet
                            </div>
                            <NoteGroup
                                v-for="group in noteGroups"
                                :key="group.id"
                                :title="group.name"
                                :schema="noteListSchema"
                                :notes="group.notes"
                            />
                        </div>
                        <FileExplorer
                            v-else
                            @toggle="onFileToggle"
                            @select="onFileSelect"
                            @search-input="onFileSearchInput"
                            @search-select="onFileSearchSelect"
                        />
                    </div>
                </div>
            </template>

            <template #content>
                <div class="ws-content">
                    <TabStrip v-if="openChatIds.length" :schema="WsTabStripSchema" />
                    <div class="ws-content__body">
                        <KeepAlive>
                            <ChatTab
                                v-if="contentView.type === 'chat' && activeChatTabSchema"
                                :key="activeChatTabSchema.chatId"
                                :schema="activeChatTabSchema"
                            />
                        </KeepAlive>
                        <KeepAlive>
                            <NotesTab
                                v-if="contentView.type === 'note' && activeNote"
                                :key="activeNote.id"
                                :schema="buildNotesTabSchema(activeNote)"
                            />
                        </KeepAlive>
                        <SettingsTab
                            v-if="contentView.type === 'settings'"
                            :schema="buildSettingsTabSchema()"
                        />
                        <div v-if="!openChatIds.length" class="ws-content__empty">
                            <div class="ws-empty__icon">
                                <EmojiPuzzled width="48" height="48" style="opacity: 0.3" />
                            </div>
                            <h2 class="ws-empty__title">
                                Select something on the left to get started.
                            </h2>
                            <p class="ws-empty__desc">
                                You can create a new chat by hovering Chat button over the sidebar
                                and clicking the "+" button.
                            </p>
                        </div>
                    </div>
                </div>
            </template>
        </ContainerGrid>
    </div>

    <div v-else class="ws-layout ws-layout--empty">
        <div class="ws-empty-icon">
            <Album width="48" height="48" style="opacity: 0.3" />
        </div>
        <h2 class="ws-empty-title">
            {{ wsStorer.workspaces.length ? 'Select a workspace' : 'No workspaces yet' }}
        </h2>
        <p class="ws-empty-desc">
            {{
                wsStorer.workspaces.length
                    ? 'Choose a workspace from the top bar to get started.'
                    : 'Create a workspace from the top bar to get started.'
            }}
        </p>
    </div>
</template>

<style>
@import url('@/assets/workspace.css');
</style>
