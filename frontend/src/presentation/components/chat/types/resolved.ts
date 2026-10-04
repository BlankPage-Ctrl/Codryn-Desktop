import type { DropdownItemConfig } from '@/presentation/components/dropdown/types'
import type { MessagePartSchema, ToolData } from './schema'
import type { AttachedImage } from './attachment'
import type {
    MentionItem,
    MentionTriggerRange,
    ChatMode,
    RevertPreviewState,
} from '@/core/entities'
import type { HitlDockSchema } from '@/presentation/components/hitl'

export type {
    ChatTabSchema,
    ChatErrorBannerSchema,
    ChatInputSchema,
    MessageBubbleSchema,
    MessageListSchema,
    TextPartSchema,
    ReasoningPartSchema,
    ToolCallPartSchema,
    ToolCallGroupPartSchema,
    WorkLogPartSchema,
    SourcePartSchema,
    FilePartSchema,
    ListFilesToolData,
    ReadFileToolData,
    EditFileToolData,
    RunShellToolData,
    ToolData,
    ToolFileNode,
    FeedWorkPartState,
    StepIndicatorSchema,
    MessagePartSchema,
} from './schema'

export interface ResolvedChatTab {
    header: { title: string }
    chatId: string
    hitl: HitlDockSchema | null
    messageList: ResolvedMessageList
    errorBanner: ResolvedChatErrorBanner | null
    input: ResolvedChatInput
}

export interface ResolvedChatInput {
    placeholder: string
    disabled: boolean
    modelId?: string
    providerId?: string
    thinkingMode?: string
    mode: ChatMode
    modelItems: DropdownItemConfig[]
    selectedLabel: string
    mentionItems: MentionItem[]
    mentionLoading: boolean
    attachedImages: AttachedImage[]
    onPickImages?: () => void
    onRemoveImage?: (localId: string) => void
    onSend?: (text: string) => void
    onStop?: () => void
    onSelectModel?: (modelId: string, providerId: string) => void
    onChangeThinkingMode?: (mode: string) => void
    onChangeMode?: (mode: ChatMode) => void
    onMentionSearch?: (query: string, range: MentionTriggerRange) => void
    editDraft: string | null
    onCancelEdit?: () => void
    /** Revert preview for the active edit draft (banner warning + toggle). */
    revertPreview: RevertPreviewState | null
    onToggleRestoreFiles?: (enabled: boolean) => void
}

export interface ResolvedChatErrorBanner {
    message: string
    code?: string
    ttlMs?: number
    onDismiss?: () => void
}

export interface ResolvedMessageBubble {
    role: 'user' | 'assistant'
    roleLabel: string
    avatarLabel: string
    parts: MessagePartSchema[]
    contentWidth?: number
    messageId?: string
    onEditMessage?: (messageId: string) => void
    canEdit: boolean
    /** Plain text of the user message, for the copy action. Empty for assistant. */
    copyText: string
    canCopy: boolean
}

export interface ResolvedMessage {
    id: string
    role: 'user' | 'assistant'
    parts: MessagePartSchema[]
    /** Plain text of the user message, for the copy action. Empty for assistant. */
    copyText: string
    canCopy: boolean
}

export interface ResolvedMessageList {
    messages: ResolvedMessage[]
    loading: boolean
    /** Resolves `attachment://<id>` refs for history thumbnails. Provided by the View. */
    resolveAttachmentUrl?: (attachmentId: string) => Promise<string | null>
    contentWidth?: number
    emptyMessage: string
    emptyHint: string
    onEditMessage?: (messageId: string) => void
}

export interface ResolvedTextPart {
    text: string
    state?: string
    fontSize: number
    lineHeight: number
}

export interface ResolvedReasoningPart {
    text: string
    state?: string
    isRunning: boolean
    isDone: boolean
    statusText: string
}

export interface ResolvedToolCallPart {
    toolName: string
    toolCallId: string
    state: string
    input?: unknown
    output?: unknown
    errorText?: string
    frontend?: ToolData
    isRunning: boolean
    isDone: boolean
    isError: boolean
    statusText: string
}

export interface ResolvedToolCallGroup {
    count: number
    running: number
    done: number
    failed: number
    statusText: string
    defaultExpanded: boolean
}

export interface ResolvedWorkLog {
    stepCount: number
    toolCount: number
    thinkCount: number
    running: number
    failed: number
    statusText: string
    defaultExpanded: boolean
}

export interface ResolvedSourcePart {
    sourceId: string
    url?: string
    title?: string
    mediaType?: string
    icon: string
    displayTitle: string
    isLink: boolean
}

export interface ResolvedFilePart {
    mediaType: string
    url?: string
    filename?: string
    icon: string
    displayName: string
    typeLabel: string
    isLink: boolean
}

export interface ResolvedStepIndicator {
    label?: string
}
