import type { ChatInputSchema } from '../types/schema'
import type { ResolvedChatInput } from '../types/resolved'
import type { DropdownItemConfig } from '@/presentation/components/dropdown/types'

export function resolveChatInputSchema(schema: ChatInputSchema): ResolvedChatInput {
    const modelItems: DropdownItemConfig[] = []

    schema.providers.forEach((provider, idx) => {
        modelItems.push({
            id: `hdr-${provider.id}`,
            label: provider.name,
            type: 'label',
        })

        provider.models.forEach((model) => {
            modelItems.push({
                id: model.id,
                label: model.displayName || model.modelId,
                value: model.id,
                providerId: provider.id,
                selected: model.id === schema.modelId,
            })
        })

        if (idx < schema.providers.length - 1) {
            modelItems.push({ id: `sep-${provider.id}`, type: 'separator' })
        }
    })

    if (modelItems.length === 0) {
        modelItems.push({
            id: 'no-models',
            label: 'No models available',
            enabled: false,
        })
    }

    let selectedLabel = 'Select model'
    if (schema.modelId) {
        for (const provider of schema.providers) {
            const model = provider.models.find((m) => m.id === schema.modelId)
            if (model) {
                selectedLabel = model.displayName || model.modelId
                break
            }
        }
    }

    return {
        placeholder: schema.placeholder ?? 'Type a message...',
        disabled: !!schema.disabled,
        modelId: schema.modelId,
        providerId: schema.providerId,
        thinkingMode: schema.thinkingMode,
        mode: schema.mode ?? 'ask',
        modelItems,
        selectedLabel,
        mentionItems: schema.mentionItems ?? [],
        mentionLoading: !!schema.mentionLoading,
        attachedImages: schema.attachedImages ?? [],
        onPickImages: schema.onPickImages,
        onRemoveImage: schema.onRemoveImage,
        editDraft: schema.draftText ?? null,
        onSend: schema.onSend,
        onStop: schema.onStop,
        onSelectModel: schema.onSelectModel,
        onChangeThinkingMode: schema.onChangeThinkingMode,
        onChangeMode: schema.onChangeMode,
        onMentionSearch: schema.onMentionSearch,
        onCancelEdit: schema.onCancelEdit,
        revertPreview: schema.revertPreview ?? null,
        onToggleRestoreFiles: schema.onToggleRestoreFiles,
    }
}
