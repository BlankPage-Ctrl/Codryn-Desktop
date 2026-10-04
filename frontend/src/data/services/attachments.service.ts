import {
    PickImages,
    UploadAttachment,
    GetAttachmentDataURL,
} from '../../../wailsjs/go/attachments/Service'
import type {
    AttachmentRepository,
    PickedImage,
    UploadAttachmentInput,
    UploadAttachmentResult,
} from '@/core/repositories'

export const attachmentsRepository: AttachmentRepository = {
    pickImages: (): Promise<PickedImage[]> => PickImages() as Promise<PickedImage[]>,
    uploadAttachment: (
        workspaceId: string,
        input: UploadAttachmentInput,
    ): Promise<UploadAttachmentResult> =>
        UploadAttachment(
            workspaceId,
            input.filename,
            input.mediaType,
            input.dataBase64,
        ) as Promise<UploadAttachmentResult>,
    getAttachmentDataURL: (workspaceId: string, attachmentId: string): Promise<string> =>
        GetAttachmentDataURL(workspaceId, attachmentId),
}
