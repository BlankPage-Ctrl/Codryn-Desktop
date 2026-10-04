import { ListPending, GetByID, SubmitResponse, Cancel } from '../../../wailsjs/go/hitl/Service'
import { normalizeHitlRequest } from '@/core/entities'
import type { FEHitlRequest, FEHitlResponse } from '@/core/entities'
import type { HitlRepository } from '@/core/repositories'

export const hitlRepository: HitlRepository = {
    listPending: async (): Promise<FEHitlRequest[]> => {
        const raw = (await ListPending()) as unknown
        if (!Array.isArray(raw)) return []
        const out: FEHitlRequest[] = []
        for (const item of raw) {
            const request = normalizeHitlRequest(item)
            if (request) out.push(request)
        }
        return out
    },
    getById: async (id: string): Promise<FEHitlRequest | null> => {
        const raw = (await GetByID(id)) as unknown
        return normalizeHitlRequest(raw)
    },
    submitResponse: async (id: string, response: FEHitlResponse): Promise<FEHitlRequest | null> => {
        const raw = (await SubmitResponse(id, { response })) as unknown
        return normalizeHitlRequest(raw)
    },
    cancel: async (id: string): Promise<void> => {
        await Cancel(id)
    },
}
