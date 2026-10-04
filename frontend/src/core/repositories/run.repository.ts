import type { Run, StartRunResult } from '../entities'

export interface WatchHandle {
    watchId: string
    runId: string
}

export interface RunRepository {
    start(workspaceId: string, chatId: string, message: unknown): Promise<StartRunResult>
    get(workspaceId: string, chatId: string, runId: string): Promise<Run>
    list(workspaceId: string, chatId: string): Promise<Run[]>
    cancel(workspaceId: string, chatId: string, runId: string): Promise<Run>
}
