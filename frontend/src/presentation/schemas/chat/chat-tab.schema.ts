import type { ChatTabSchema } from '@/presentation/components/chat/types/schema'
import type { AttachedImage } from '@/presentation/components/chat/types/attachment'
import type {
    MentionItem,
    MentionTriggerRange,
    Provider,
    ChatMode,
    RevertPreviewState,
} from '@/core/entities'
import type { Chat } from '@/core/entities'
import type { ChatSessionState } from '@/application/stores'
import type { HitlDockSchema } from '@/presentation/components/hitl'

export interface ChatTabParams {
    chat: Chat
    hitl?: HitlDockSchema | null
    state: ChatSessionState
    providers: Provider[]
    contentWidth?: number
    fontSize?: number
    lineHeight?: number
    mentionItems?: MentionItem[]
    mentionLoading?: boolean
    attachedImages?: AttachedImage[]
    /** Resolves `attachment://<id>` refs for history thumbnails. Provided by the View. */
    resolveAttachmentUrl?: (attachmentId: string) => Promise<string | null>
    onPickImages?: () => void
    onRemoveImage?: (localId: string) => void
    onSend?: (text: string) => void
    onStop?: () => void
    onUpdateModel?: (modelId: string, providerId: string) => void
    onChangeThinkingMode?: (mode: string) => void
    onChangeMode?: (mode: ChatMode) => void
    onMentionSearch?: (query: string, range: MentionTriggerRange) => void
    draftText?: string
    onCancelEdit?: () => void
    onEditMessage?: (messageId: string) => void
    onDismissError?: () => void
    revertPreview?: RevertPreviewState | null
    onToggleRestoreFiles?: (enabled: boolean) => void
}

function toErrorSchema(error: unknown): { message: string; code?: string } | undefined {
    if (!(error instanceof Error)) return undefined
    const code = (error as { code?: unknown }).code
    return {
        message: error.message || 'Run failed',
        ...(typeof code === 'string' && code !== '' ? { code } : {}),
    }
}

export function createChatTabSchema(params: ChatTabParams): ChatTabSchema {
    return {
        title: params.chat.title,
        chatId: params.chat.id,
        resolveAttachmentUrl: params.resolveAttachmentUrl,
        hitl: params.hitl ?? null,
        messages: params.state.messages,
        loading: params.state.isLoading,
        providers: params.providers,
        modelId: params.chat.modelId,
        providerId: params.chat.providerId,
        thinkingMode: params.chat.thinkingMode,
        mode: params.chat.mode ?? 'ask',
        contentWidth: params.contentWidth,
        fontSize: params.fontSize,
        lineHeight: params.lineHeight,
        mentionItems: params.mentionItems,
        mentionLoading: params.mentionLoading,
        attachedImages: params.attachedImages,
        onPickImages: params.onPickImages,
        onRemoveImage: params.onRemoveImage,
        onSend: params.onSend,
        onStop: params.onStop,
        onSelectModel: params.onUpdateModel,
        onChangeThinkingMode: params.onChangeThinkingMode,
        onChangeMode: params.onChangeMode,
        onMentionSearch: params.onMentionSearch,
        draftText: params.draftText,
        onCancelEdit: params.onCancelEdit,
        onEditMessage: params.onEditMessage,
        revertPreview: params.revertPreview,
        onToggleRestoreFiles: params.onToggleRestoreFiles,
        error: toErrorSchema(params.state.error) ?? null,
        onDismissError: params.onDismissError,
    }
}
