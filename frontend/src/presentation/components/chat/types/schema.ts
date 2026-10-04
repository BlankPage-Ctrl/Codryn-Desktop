import type {
    FeedMessage,
    Provider,
    MentionItem,
    MentionTriggerRange,
    ChatMode,
    RevertPreviewState,
} from '@/core/entities'
import type { HitlDockSchema } from '@/presentation/components/hitl'
import type { AttachedImage } from './attachment'

export interface ChatErrorBannerSchema {
    message: string
    code?: string
    /** Auto-dismiss after ms. Defaults to 8000. <= 0 disables TTL. */
    ttlMs?: number
}

export interface ChatTabSchema {
    title: string
    chatId: string
    hitl: HitlDockSchema | null
    messages: FeedMessage[]
    loading?: boolean
    providers: Provider[]
    modelId?: string
    providerId?: string
    thinkingMode?: string
    mode?: ChatMode
    contentWidth?: number
    fontSize?: number
    lineHeight?: number
    emptyMessage?: string
    emptyHint?: string
    mentionItems?: MentionItem[]
    mentionLoading?: boolean
    attachedImages?: AttachedImage[]
    /** Resolves `attachment://<id>` refs for history thumbnails. Provided by the View. */
    resolveAttachmentUrl?: (attachmentId: string) => Promise<string | null>
    onPickImages?: () => void
    onRemoveImage?: (localId: string) => void
    onSend?: (text: string) => void
    onStop?: () => void
    onSelectModel?: (modelId: string, providerId: string) => void
    onChangeThinkingMode?: (mode: string) => void
    onChangeMode?: (mode: ChatMode) => void
    onMentionSearch?: (query: string, range: MentionTriggerRange) => void
    draftText?: string
    onCancelEdit?: () => void
    onEditMessage?: (messageId: string) => void
    error?: ChatErrorBannerSchema | null
    onDismissError?: () => void
    revertPreview?: RevertPreviewState | null
    onToggleRestoreFiles?: (enabled: boolean) => void
}

export interface ChatInputSchema {
    disabled?: boolean
    modelId?: string
    providerId?: string
    thinkingMode?: string
    mode?: ChatMode
    providers: Provider[]
    placeholder?: string
    mentionItems?: MentionItem[]
    mentionLoading?: boolean
    attachedImages?: AttachedImage[]
    onPickImages?: () => void
    onRemoveImage?: (localId: string) => void
    onSend?: (text: string) => void
    onStop?: () => void
    onSelectModel?: (modelId: string, providerId: string) => void
    onChangeThinkingMode?: (mode: string) => void
    onChangeMode?: (mode: ChatMode) => void
    onMentionSearch?: (query: string, range: MentionTriggerRange) => void
    draftText?: string
    onCancelEdit?: () => void
    revertPreview?: RevertPreviewState | null
    onToggleRestoreFiles?: (enabled: boolean) => void
}

export interface MessageBubbleSchema {
    role: 'user' | 'assistant'
    blocks: FeedMessage['blocks']
    contentWidth?: number
    messageId?: string
    onEditMessage?: (messageId: string) => void
}

export interface MessageListSchema {
    messages: FeedMessage[]
    loading?: boolean
    /** Resolves `attachment://<id>` refs for history thumbnails. Provided by the View. */
    resolveAttachmentUrl?: (attachmentId: string) => Promise<string | null>
    contentWidth?: number
    fontSize?: number
    lineHeight?: number
    emptyMessage?: string
    emptyHint?: string
    onEditMessage?: (messageId: string) => void
}

export interface TextPartSchema {
    text: string
    /** 'streaming' while the slice is open, 'done' after close. */
    state?: string
    fontSize?: number
    lineHeight?: number
    /** Stable id from FeedBlock.sliceId. Used as Vue key so streaming updates do not remount. */
    partId?: string
}

export interface ReasoningPartSchema {
    text: string
    /** 'streaming' while the slice is open, 'done' after close. */
    state?: string
    /** Stable id from FeedBlock.sliceId. */
    partId?: string
}

export type FeedWorkPartState = 'queued' | 'active' | 'ok' | 'bad'

export interface ToolCallPartSchema {
    toolName: string
    toolCallId: string
    state: FeedWorkPartState
    input?: unknown
    output?: unknown
    errorText?: string
    frontend?: ToolData
    /** Stable id from FeedBlock.sliceId (falls back to toolCallId). */
    partId?: string
}

/** Consecutive tool calls collapsed into one block. Only built for runs of 2+. */
export interface ToolCallGroupPartSchema {
    items: ToolCallPartSchema[]
    /** Derived from member partIds so the group keeps one key while streaming. */
    partId?: string
}

/**
 * Giant group wrapping everything before the final text once the agent
 * loop is finished. Items are already Level-1 grouped parts; never nested.
 */
export interface WorkLogPartSchema {
    items: MessagePartSchema[]
    stepCount: number
    /** Derived from member partIds. */
    partId?: string
}

export interface SourcePartSchema {
    sourceId: string
    url?: string
    title?: string
    mediaType?: string
    partId?: string
}

export interface FilePartSchema {
    mediaType: string
    url?: string
    filename?: string
    partId?: string
}

export interface ToolFileNode {
    id: string
    name: string
    path: string
    type: string
    isDirectory: boolean
    size?: number
    lastModified?: number
    hasChildren?: boolean
    children?: ToolFileNode[]
    meta?: {
        isSymlink?: boolean
        symlinkTarget?: string
    }
}

export interface ListFilesToolData {
    toolCallId: string
    requestedPath: string
    nodes: ToolFileNode[]
    total: number
    limit?: number
}

export interface ReadFileToolData {
    toolCallId: string
    path: string
    content: string
    contentWithLineNumbers?: string
    encoding: string
    size: number
    truncated: boolean
    totalLines?: number
}

export interface EditFileToolData {
    toolCallId: string
    path: string
    appliedEdits: number
    content: string
    contentWithLineNumbers?: string
    encoding: string
    size: number
    totalLines: number
    diff?: string
    diffTruncated?: boolean
}

export interface RunShellToolData {
    toolCallId: string
    executionId: string
    command: string
    cwd: string
    exitCode: number
    stdout: string
    stderr: string
    stdoutAnsi: string
    stderrAnsi: string
    truncated: boolean
    spillPath: string | null
    durationMs: number
    timedOut: boolean
    signal: string | null
}

export interface CreateFileToolData {
    toolCallId: string
    path: string
    content: string
    contentWithLineNumbers?: string
    encoding: string
    size: number
    truncated?: boolean
    totalLines: number
}

export type ToolData =
    | ListFilesToolData
    | ReadFileToolData
    | EditFileToolData
    | RunShellToolData
    | CreateFileToolData

export interface StepIndicatorSchema {
    label?: string
    partId?: string
}

export type MessagePartSchema =
    | ({ type: 'text' } & TextPartSchema)
    | ({ type: 'reasoning' } & ReasoningPartSchema)
    | ({ type: 'tool-call' } & ToolCallPartSchema)
    | ({ type: 'tool-call-group' } & ToolCallGroupPartSchema)
    | ({ type: 'work-log' } & WorkLogPartSchema)
    | ({ type: 'source' } & SourcePartSchema)
    | ({ type: 'file' } & FilePartSchema)
    | ({ type: 'step-start' } & StepIndicatorSchema)
