export type RunStatus = 'running' | 'done' | 'failed' | 'cancelled'

export interface Run {
    runId: string
    chatId: string
    workspaceId: string
    assistantMessageId: string
    status: RunStatus
}

export interface StartRunResult {
    runId: string
    assistantMessageId: string
    status: RunStatus
}
