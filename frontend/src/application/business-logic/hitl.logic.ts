import type { HitlRepository, HitlWatchPort } from '@/core/repositories'
import type { FEHitlRequest, FEHitlResponse } from '@/core/entities'
import type { HitlWatchHandlers } from '@/core/repositories'

export interface HitlBusinessLogicDeps {
    repo: HitlRepository
    watch: HitlWatchPort
}

export interface HitlBusinessLogic {
    listPending(): Promise<FEHitlRequest[]>
    submit(id: string, response: FEHitlResponse): Promise<FEHitlRequest | null>
    cancel(id: string): Promise<void>
    watch(handlers: HitlWatchHandlers): () => void
}

export function createHitlBusinessLogic(deps: HitlBusinessLogicDeps): HitlBusinessLogic {
    return {
        listPending: () => deps.repo.listPending(),
        submit: (id, response) => deps.repo.submitResponse(id, response),
        cancel: (id) => deps.repo.cancel(id),
        watch: (handlers) => deps.watch.watch(handlers),
    }
}
