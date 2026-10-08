import type { ComposerAttachment } from '@/core/entities'
import type { ComposerStorer } from '../stores/composer.storer'

export interface ComposerStoreLogic {
    list(chatId: string): ComposerAttachment[]
    append(chatId: string, item: ComposerAttachment): void
    patch(chatId: string, localId: string, patch: Partial<ComposerAttachment>): void
    remove(chatId: string, localId: string): void
    move(fromId: string, toId: string): void
    take(chatId: string): ComposerAttachment[]
    discard(chatId: string): void
    clear(): void
}

export function createComposerStoreLogic(getStorer: () => ComposerStorer): ComposerStoreLogic {
    function list(chatId: string): ComposerAttachment[] {
        return getStorer().attachments[chatId] ?? []
    }

    function append(chatId: string, item: ComposerAttachment): void {
        getStorer().appendAttachment(chatId, item)
    }

    function patch(chatId: string, localId: string, patch: Partial<ComposerAttachment>): void {
        getStorer().patchAttachment(chatId, localId, patch)
    }

    function remove(chatId: string, localId: string): void {
        const storer = getStorer()
        const list = storer.attachments[chatId]
        if (!list) return
        storer.setAttachments(
            chatId,
            list.filter((img) => img.localId !== localId),
        )
    }

    function move(fromId: string, toId: string): void {
        if (fromId === toId) return
        const storer = getStorer()
        const list = storer.attachments[fromId]
        if (list !== undefined && storer.attachments[toId] === undefined) {
            storer.setAttachments(toId, list)
        }
        storer.removeAttachments(fromId)
    }

    function take(chatId: string): ComposerAttachment[] {
        const items = list(chatId)
        getStorer().removeAttachments(chatId)
        return items
    }

    function discard(chatId: string): void {
        getStorer().removeAttachments(chatId)
    }

    function clear(): void {
        getStorer().clearAll()
    }

    return { list, append, patch, remove, move, take, discard, clear }
}
