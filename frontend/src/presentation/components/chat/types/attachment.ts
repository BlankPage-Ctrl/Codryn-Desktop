/** Composer-side image attachment state (upload-before-send lifecycle). */
export type AttachedImageStatus = 'uploading' | 'ready' | 'error'

export interface AttachedImage {
    localId: string
    filename: string
    mediaType: string
    sizeBytes: number
    /** Local data-URL preview for instant rendering. */
    previewUrl: string
    status: AttachedImageStatus
    /** Backend id once the upload succeeds (pending -> linked on send). */
    attachmentId?: string
    error?: string
}

/** Backend limits mirrored from packages/backend/src/attachments. */
export const MAX_IMAGES_PER_MESSAGE = 5
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024

export const ATTACHMENT_URL_SCHEME = 'attachment://'

export function attachmentIdFromUrl(url: string): string | null {
    if (!url.startsWith(ATTACHMENT_URL_SCHEME)) return null
    const id = url.slice(ATTACHMENT_URL_SCHEME.length)
    return id.length > 0 ? id : null
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
