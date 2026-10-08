/** Image attachment entity. Mirrors the backend attachment contract. */
export interface ChatImageAttachment {
    attachmentId: string
    mediaType: string
    filename?: string
    /** Local preview (data-URL) for instant optimistic rendering. */
    previewUrl?: string
}

/** Composer draft lifecycle for one picked image (upload-before-send). */
export type ComposerAttachmentStatus = 'uploading' | 'ready' | 'error'

export interface ComposerAttachment {
    localId: string
    filename: string
    mediaType: string
    sizeBytes: number
    /** Local data-URL preview for instant rendering. */
    previewUrl: string
    status: ComposerAttachmentStatus
    /** Backend id once the upload succeeds (pending -> linked on send). */
    attachmentId?: string
    error?: string
}

export const MAX_COMPOSER_IMAGES_PER_MESSAGE = 5
