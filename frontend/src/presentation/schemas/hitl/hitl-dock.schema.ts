import { resolveHitlDockSchema } from '@/presentation/components/hitl'
import type { HitlCardCallbacks, HitlDockSchema } from '@/presentation/components/hitl'
import type { HitlItemState } from '@/application/stores'

export interface HitlDockParams extends HitlCardCallbacks {
    items: HitlItemState[]
}

export function createHitlDockSchema(params: HitlDockParams): HitlDockSchema {
    return resolveHitlDockSchema(params.items, {
        onApprove: params.onApprove,
        onApproveWithModification: params.onApproveWithModification,
        onDeny: params.onDeny,
        onAskSubmit: params.onAskSubmit,
        onChoiceSubmit: params.onChoiceSubmit,
        onDismiss: params.onDismiss,
    })
}
