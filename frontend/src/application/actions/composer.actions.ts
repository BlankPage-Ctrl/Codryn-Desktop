import type { ComposerStoreLogic } from '../store-logic/composer.logic'
import type { AttachmentRepository } from '@/core/repositories'
import type { ChatImageAttachment, ComposerAttachment } from '@/core/entities'
import { MAX_COMPOSER_IMAGES_PER_MESSAGE } from '@/core/entities'

export interface ComposerActions {
    addImages(workspaceId: string, chatId: string): Promise<void>
    removeImage(chatId: string, localId: string): void
    takeAttachments(chatId: string): ChatImageAttachment[]
    moveAttachments(fromId: string, toId: string): void
    discard(chatId: string): void
    clear(): void
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

export function createComposerActions(
    storeLogic: ComposerStoreLogic,
    repo: AttachmentRepository,
): ComposerActions {
    async function addImages(workspaceId: string, chatId: string): Promise<void> {
        let picked: Array<{
            filename: string
            mediaType: string
            dataBase64: string
            sizeBytes: number
        }>
        try {
            picked = await repo.pickImages()
        } catch {
            return
        }
        if (picked.length === 0) return
        for (const p of picked) {
            if (storeLogic.list(chatId).length >= MAX_COMPOSER_IMAGES_PER_MESSAGE) break
            const localId = crypto.randomUUID()
            const item: ComposerAttachment = {
                localId,
                filename: p.filename,
                mediaType: p.mediaType,
                sizeBytes: p.sizeBytes,
                previewUrl: `data:${p.mediaType};base64,${p.dataBase64}`,
                status: 'uploading',
            }
            storeLogic.append(chatId, item)
            try {
                const res = await withUploadTimeout(
                    repo.uploadAttachment(workspaceId, {
                        filename: p.filename,
                        mediaType: p.mediaType,
                        dataBase64: p.dataBase64,
                    }),
                )
                // The composer list may have been consumed (sent) while uploading.
                if (!storeLogic.list(chatId).some((a) => a.localId === localId)) continue
                storeLogic.patch(chatId, localId, {
                    attachmentId: res.attachment.id,
                    status: 'ready',
                })
            } catch (e: unknown) {
                storeLogic.patch(chatId, localId, {
                    status: 'error',
                    error: e instanceof Error ? e.message : 'Upload failed',
                })
            }
        }
    }

    function removeImage(chatId: string, localId: string): void {
        storeLogic.remove(chatId, localId)
    }

    function takeAttachments(chatId: string): ChatImageAttachment[] {
        return storeLogic.take(chatId).map((img) => ({
            attachmentId: img.attachmentId ?? '',
            mediaType: img.mediaType,
            filename: img.filename,
            previewUrl: img.previewUrl,
        }))
    }

    function moveAttachments(fromId: string, toId: string): void {
        storeLogic.move(fromId, toId)
    }

    function discard(chatId: string): void {
        storeLogic.discard(chatId)
    }

    function clear(): void {
        storeLogic.clear()
    }

    return { addImages, removeImage, takeAttachments, moveAttachments, discard, clear }
}
