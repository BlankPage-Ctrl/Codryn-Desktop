import { StartRun, GetRun, ListRuns, CancelRun } from '../../../wailsjs/go/stream/RunStreamService'
import type { Run, StartRunResult } from '@/core/entities'
import type { RunRepository } from '@/core/repositories'

export const runsRepository: RunRepository = {
    start: (workspaceId: string, chatId: string, message: unknown) =>
        StartRun(workspaceId, chatId, JSON.stringify({ message })) as Promise<StartRunResult>,
    get: (workspaceId: string, chatId: string, runId: string) =>
        GetRun(workspaceId, chatId, runId) as Promise<Run>,
    list: (workspaceId: string, chatId: string) => ListRuns(workspaceId, chatId) as Promise<Run[]>,
    cancel: (workspaceId: string, chatId: string, runId: string) =>
        CancelRun(workspaceId, chatId, runId) as Promise<Run>,
}
