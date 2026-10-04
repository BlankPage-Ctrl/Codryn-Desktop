/** Image attachment entity. Mirrors the backend attachment contract. */
export interface ChatImageAttachment {
    attachmentId: string
    mediaType: string
    filename?: string
    /** Local preview (data-URL) for instant optimistic rendering. */
    previewUrl?: string
}
