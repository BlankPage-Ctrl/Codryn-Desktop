import type {
    AttachmentRepository,
    PickedImage,
    UploadAttachmentInput,
    UploadAttachmentResult,
} from '@/core/repositories'

export interface AttachmentActions {
    pickImages(): Promise<PickedImage[]>
    uploadAttachment(
        workspaceId: string,
        input: UploadAttachmentInput,
    ): Promise<UploadAttachmentResult>
    getAttachmentDataURL(workspaceId: string, attachmentId: string): Promise<string>
}

export function createAttachmentActions(repo: AttachmentRepository): AttachmentActions {
    async function pickImages(): Promise<PickedImage[]> {
        return repo.pickImages()
    }

    async function uploadAttachment(
        workspaceId: string,
        input: UploadAttachmentInput,
    ): Promise<UploadAttachmentResult> {
        const result = await repo.uploadAttachment(workspaceId, input)
        console.log('Attachment uploaded:', result)
        return result
    }

    async function getAttachmentDataURL(
        workspaceId: string,
        attachmentId: string,
    ): Promise<string> {
        return repo.getAttachmentDataURL(workspaceId, attachmentId)
    }

    return { pickImages, uploadAttachment, getAttachmentDataURL }
}
