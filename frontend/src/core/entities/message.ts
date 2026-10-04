export interface RevertFileItem {
    path: string
    op: 'restored' | 'deleted'
}

export interface RevertConflictWriter {
    chatId: string
    messageId: string
    createdAt: string
}

export interface RevertConflict {
    path: string
    reason: 'MODIFIED_AFTER' | 'NO_SNAPSHOT'
    expectedHash: string | null
    currentHash: string | null
    lastWriter: RevertConflictWriter | null
}

export interface RevertFileRestore {
    restored: RevertFileItem[]
    conflicts: RevertConflict[]
}

export interface RevertResult {
    deletedMessageIds: string[]
    cancelledRunIds: string[]
    fileRestore?: RevertFileRestore
}

export interface RevertFilePlan {
    path: string
    op: 'restored' | 'deleted'
    status: 'ok' | 'conflict'
    reason: 'MODIFIED_AFTER' | 'NO_SNAPSHOT' | null
    expectedHash: string | null
    currentHash: string | null
    lastWriter: RevertConflictWriter | null
    diffPreview?: string | null
}

export interface RevertPreview {
    targetMessageId: string
    fromPosition: number
    suffixIds: string[]
    files: RevertFilePlan[]
}

export type RevertPreviewStatus = 'loading' | 'ready' | 'error'

/**
 * Edit-draft revert preview state for the composer banner. `restoreFiles`
 * is the user-controlled toggle (default true); the banner only shows the
 * toggle while `status === 'ready'` and files are touched.
 */
export interface RevertPreviewState {
    status: RevertPreviewStatus
    preview?: RevertPreview
    restoreFiles: boolean
}
