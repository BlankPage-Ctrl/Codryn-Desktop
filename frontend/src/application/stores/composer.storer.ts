import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ComposerAttachment } from '@/core/entities'

export const useComposerStorer = defineStore('composer', () => {
    const attachments = ref<Record<string, ComposerAttachment[]>>({})

    function setAttachments(chatId: string, list: ComposerAttachment[]): void {
        attachments.value[chatId] = list
    }

    function appendAttachment(chatId: string, item: ComposerAttachment): void {
        const list = attachments.value[chatId]
        if (list) {
            list.push(item)
        } else {
            attachments.value[chatId] = [item]
        }
    }

    function patchAttachment(
        chatId: string,
        localId: string,
        patch: Partial<ComposerAttachment>,
    ): void {
        const item = attachments.value[chatId]?.find((a) => a.localId === localId)
        if (!item) return
        Object.assign(item, patch)
    }

    function removeAttachments(chatId: string): void {
        delete attachments.value[chatId]
    }

    function clearAll(): void {
        attachments.value = {}
    }

    return {
        attachments,
        setAttachments,
        appendAttachment,
        patchAttachment,
        removeAttachments,
        clearAll,
    }
})

export type ComposerStorer = ReturnType<typeof useComposerStorer>
