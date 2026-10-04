import type { FEHitlRequest } from '@/core/entities'
import type { HitlItemState, HitlStorer } from '@/application/stores'
import type {
    HitlApprovalCardSchema,
    HitlAskCardSchema,
    HitlAskStepSchema,
    HitlCardCallbacks,
    HitlCardSchema,
    HitlChoiceCardSchema,
    HitlChoiceMode,
    HitlChoiceOptionSchema,
    HitlDockSchema,
} from '../types/schema'

type Storer = Pick<HitlStorer, 'pendingForChat'>

function toStringOrUndefined(value: unknown): string | undefined {
    return typeof value === 'string' && value ? value : undefined
}

function toNumberOrUndefined(value: unknown): number | undefined {
    return typeof value === 'number' ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function resolveApproval(
    item: HitlItemState,
    callbacks: HitlCardCallbacks,
): HitlApprovalCardSchema {
    const request = item.request
    const payloadRecord = request.payload as Record<string, unknown>
    const neutralMod = isRecord(payloadRecord.modification) ? payloadRecord.modification : undefined
    const neutralInitial = toStringOrUndefined(neutralMod?.initialValue)
    const neutralLabel = toStringOrUndefined(neutralMod?.label)
    const neutralPlaceholder = toStringOrUndefined(neutralMod?.placeholder)

    const contextPreview = isRecord(payloadRecord.contextPreview)
        ? payloadRecord.contextPreview
        : undefined
    const fallbackCommand = toStringOrUndefined(contextPreview?.command)
    const fallbackCwd = toStringOrUndefined(contextPreview?.cwd)
    const fallbackMatched = isRecord(contextPreview?.matched) ? contextPreview.matched : undefined
    const fallbackReason = toStringOrUndefined(contextPreview?.reason)

    const details: HitlApprovalCardSchema['details'] = []
    if (fallbackCommand) details.push({ key: 'cmd', value: fallbackCommand })
    if (fallbackCwd) details.push({ key: 'cwd', value: fallbackCwd })
    if (toStringOrUndefined(fallbackMatched?.pattern)) {
        const pattern = String(fallbackMatched?.pattern)
        const tier = toStringOrUndefined(fallbackMatched?.tier)
        details.push({ key: 'match', value: tier ? `${pattern} (${tier})` : pattern })
    }

    const modificationDraft = neutralInitial ?? fallbackCommand ?? ''
    const supportsModification = Boolean(modificationDraft || neutralMod !== undefined)

    return {
        id: request.id,
        type: 'approval',
        title: request.title,
        description: request.description ?? fallbackReason ?? null,
        submitting: item.submitting,
        error: item.error,
        details,
        requireReasonOnReject: request.payload.requireReasonOnReject === true,
        supportsModification,
        modificationDraft,
        modificationLabel: neutralLabel ?? 'Modification',
        modificationPlaceholder: neutralPlaceholder ?? 'Edit content before approving…',
        onApprove: callbacks.onApprove,
        onApproveWithModification: callbacks.onApproveWithModification,
        onDeny: callbacks.onDeny,
    }
}

function resolveAskSteps(request: FEHitlRequest): HitlAskStepSchema[] {
    const payload = request.payload
    const wizard = payload.wizard
    if (
        wizard &&
        typeof wizard === 'object' &&
        Array.isArray((wizard as { steps?: unknown }).steps)
    ) {
        const out: HitlAskStepSchema[] = []
        for (const step of (wizard as { steps: unknown[] }).steps) {
            if (step && typeof step === 'object') {
                const entry = step as Record<string, unknown>
                if (
                    typeof entry.key === 'string' &&
                    entry.key &&
                    typeof entry.prompt === 'string' &&
                    entry.prompt
                ) {
                    out.push({
                        key: entry.key,
                        prompt: entry.prompt,
                        placeholder: toStringOrUndefined(entry.placeholder),
                    })
                }
            }
        }
        if (out.length) return out
    }
    return [
        {
            key: 'value',
            prompt: '',
            placeholder: toStringOrUndefined(payload.placeholder),
        },
    ]
}

function resolveAsk(item: HitlItemState, callbacks: HitlCardCallbacks): HitlAskCardSchema {
    const request = item.request
    return {
        id: request.id,
        type: 'ask',
        title: request.title,
        description: request.description,
        submitting: item.submitting,
        error: item.error,
        steps: resolveAskSteps(request),
        minLength: toNumberOrUndefined(request.payload.minLength),
        maxLength: toNumberOrUndefined(request.payload.maxLength),
        validationRegex: toStringOrUndefined(request.payload.validationRegex),
        onSubmit: callbacks.onAskSubmit,
        onDismiss: callbacks.onDismiss,
    }
}

function resolveChoiceOptions(request: FEHitlRequest): HitlChoiceOptionSchema[] {
    const raw = request.payload.options
    if (!Array.isArray(raw)) return []
    const out: HitlChoiceOptionSchema[] = []
    for (const entry of raw) {
        if (entry && typeof entry === 'object') {
            const option = entry as Record<string, unknown>
            if (typeof option.id === 'string' && option.id && typeof option.title === 'string') {
                out.push({
                    id: option.id,
                    title: option.title,
                    description: toStringOrUndefined(option.description),
                    recommended: option.recommended === true,
                    ...(option.allowCustomInput === true ? { allowCustomInput: true } : {}),
                })
            }
        }
    }
    return out
}

function resolveChoice(item: HitlItemState, callbacks: HitlCardCallbacks): HitlChoiceCardSchema {
    const request = item.request
    const modeRaw = request.payload.mode
    const mode: HitlChoiceMode = modeRaw === 'multi' || modeRaw === 'ranked' ? modeRaw : 'single'
    const defaultRaw = request.payload.defaultSelection
    return {
        id: request.id,
        type: 'choice',
        title: request.title,
        description: request.description,
        submitting: item.submitting,
        error: item.error,
        mode,
        options: resolveChoiceOptions(request),
        defaultSelection: Array.isArray(defaultRaw)
            ? defaultRaw.filter((id): id is string => typeof id === 'string' && id.length > 0)
            : [],
        minSelect: toNumberOrUndefined(request.payload.minSelect),
        maxSelect: toNumberOrUndefined(request.payload.maxSelect),
        allowOther: request.payload.allowOther === true,
        onSubmit: callbacks.onChoiceSubmit,
        onDismiss: callbacks.onDismiss,
    }
}

export function resolveHitlCardSchema(
    item: HitlItemState,
    callbacks: HitlCardCallbacks,
): HitlCardSchema | null {
    switch (item.request.type) {
        case 'approval':
            return resolveApproval(item, callbacks)
        case 'ask':
            return resolveAsk(item, callbacks)
        case 'choice':
            return resolveChoice(item, callbacks)
        default:
            return null
    }
}

export function resolveHitlDockSchema(
    items: HitlItemState[],
    callbacks: HitlCardCallbacks,
): HitlDockSchema {
    const cards: HitlCardSchema[] = []
    for (const item of items) {
        const card = resolveHitlCardSchema(item, callbacks)
        if (card) cards.push(card)
    }
    return { items: cards }
}

/** Convenience overload: resolve the pending requests of one chat from the store. */
export function resolveHitlDockForChat(
    storer: Storer,
    chatId: string,
    callbacks: HitlCardCallbacks,
): HitlDockSchema {
    if (!chatId) return { items: [] }
    return resolveHitlDockSchema(storer.pendingForChat(chatId), callbacks)
}
