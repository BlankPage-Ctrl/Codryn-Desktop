export interface PickedImage {
    filename: string
    mediaType: string
    dataBase64: string
    sizeBytes: number
}

export interface UploadAttachmentInput {
    filename: string
    mediaType: string
    dataBase64: string
}

export interface AttachmentMeta {
    id: string
    workspaceId: string
    originalFilename: string
    storedFilename: string
    mediaType: string
    sizeBytes: number
    status: string
    createdAt: string
    expiresAt: string | null
}

export interface UploadAttachmentResult {
    attachment: AttachmentMeta
}

export interface AttachmentRepository {
    pickImages(): Promise<PickedImage[]>
    uploadAttachment(
        workspaceId: string,
        input: UploadAttachmentInput,
    ): Promise<UploadAttachmentResult>
    getAttachmentDataURL(workspaceId: string, attachmentId: string): Promise<string>
}
