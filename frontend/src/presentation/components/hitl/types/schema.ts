export type HitlCardType = 'approval' | 'ask' | 'choice'

/**
 * Callbacks are provided by the View (via the schema factory). Components
 * only invoke them - they never touch repositories or store actions.
 */
export interface HitlCardCallbacks {
    onApprove: (id: string, always: boolean) => void
    onApproveWithModification: (id: string, modificationNote: string) => void
    onDeny: (id: string, reason?: string) => void
    onAskSubmit: (id: string, value: string) => void
    onChoiceSubmit: (id: string, selected: string[], customInput?: string) => void
    onDismiss: (id: string) => void
}

export interface HitlCardBaseSchema {
    id: string
    type: HitlCardType
    title: string
    description?: string | null
    submitting: boolean
    error?: string | null
}

export interface HitlApprovalDetailRow {
    key: string
    value: string
}

export interface HitlApprovalCardSchema extends HitlCardBaseSchema {
    type: 'approval'
    details: HitlApprovalDetailRow[]
    requireReasonOnReject: boolean
    supportsModification: boolean
    modificationDraft: string
    modificationLabel: string
    modificationPlaceholder: string
    onApprove: HitlCardCallbacks['onApprove']
    onApproveWithModification: HitlCardCallbacks['onApproveWithModification']
    onDeny: HitlCardCallbacks['onDeny']
}

export interface HitlAskStepSchema {
    key: string
    prompt: string
    placeholder?: string
}

export interface HitlAskCardSchema extends HitlCardBaseSchema {
    type: 'ask'
    steps: HitlAskStepSchema[]
    minLength?: number
    maxLength?: number
    validationRegex?: string
    onSubmit: HitlCardCallbacks['onAskSubmit']
    onDismiss: HitlCardCallbacks['onDismiss']
}

export interface HitlChoiceOptionSchema {
    id: string
    title: string
    description?: string
    recommended?: boolean
    allowCustomInput?: boolean
}

export type HitlChoiceMode = 'single' | 'multi' | 'ranked'

export interface HitlChoiceCardSchema extends HitlCardBaseSchema {
    type: 'choice'
    mode: HitlChoiceMode
    options: HitlChoiceOptionSchema[]
    defaultSelection: string[]
    minSelect?: number
    maxSelect?: number
    allowOther?: boolean
    onSubmit: HitlCardCallbacks['onChoiceSubmit']
    onDismiss: HitlCardCallbacks['onDismiss']
}

export type HitlCardSchema = HitlApprovalCardSchema | HitlAskCardSchema | HitlChoiceCardSchema

export interface HitlDockSchema {
    items: HitlCardSchema[]
}
