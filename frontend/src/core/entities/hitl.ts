export type FEHitlRequestType = 'approval' | 'ask' | 'choice'

export type FEHitlStatus = 'pending' | 'resolved' | 'expired' | 'cancelled'

export interface FEHitlRequest {
    id: string
    type: FEHitlRequestType
    title: string
    description: string | null
    correlationId: string | null
    workspaceId: string | null
    chatId: string
    executionId: string | null
    metadata: Record<string, string | number | boolean>
    status: FEHitlStatus
    createdAt: string | null
    expiresAt: string | null
    payload: Record<string, unknown>
}

export type FEHitlEvent =
    | { type: 'request'; request: unknown }
    | { type: 'resolved'; request: unknown; response?: unknown }
    | { type: 'cancelled'; request: unknown }
    | { type: 'expired'; request: unknown }

export type FEApprovalOutcome =
    | 'approved'
    | 'rejected'
    | 'always_approved'
    | 'approved_with_modification'

export interface FEApprovalResponse {
    outcome: FEApprovalOutcome
    modificationNote?: string
    reason?: string
}

export interface FEAskResponse {
    value: string
}

export interface FEChoiceResponse {
    selected: string[]
    customInput?: string
}

export type FEHitlResponse = FEApprovalResponse | FEAskResponse | FEChoiceResponse

export interface FEAskStep {
    key: string
    prompt: string
    placeholder?: string
}

export interface FEChoiceOption {
    id: string
    title: string
    description?: string
    recommended?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function decodeBytesToString(bytes: number[]): string | null {
    try {
        return new TextDecoder().decode(new Uint8Array(bytes))
    } catch {
        return null
    }
}

function decodeBase64ToString(value: string): string | null {
    try {
        const bin = atob(value)
        const bytes = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
        return new TextDecoder().decode(bytes)
    } catch {
        return null
    }
}

/**
 * The Wails binding types `payload` as `number[]` (Go `json.RawMessage` is
 * `[]byte`), but at runtime it arrives as an embedded JSON object. Accept
 * every shape defensively and always return a plain object.
 */
export function normalizeHitlPayload(payload: unknown): Record<string, unknown> {
    if (payload === null || payload === undefined) return {}
    if (isRecord(payload)) return payload
    if (typeof payload === 'string') {
        const trimmed = payload.trim()
        if (!trimmed) return {}
        try {
            const parsed: unknown = JSON.parse(trimmed)
            return isRecord(parsed) ? parsed : {}
        } catch {
            const decoded = decodeBase64ToString(trimmed)
            if (!decoded) return {}
            try {
                const parsed: unknown = JSON.parse(decoded)
                return isRecord(parsed) ? parsed : {}
            } catch {
                return {}
            }
        }
    }
    if (Array.isArray(payload)) {
        const text = decodeBytesToString(payload as number[])
        if (!text) return {}
        try {
            const parsed: unknown = JSON.parse(text)
            return isRecord(parsed) ? parsed : {}
        } catch {
            return {}
        }
    }
    return {}
}

function toStringOrNull(value: unknown): string | null {
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
    return null
}

function normalizeMetadata(metadata: unknown): Record<string, string | number | boolean> {
    if (!isRecord(metadata)) return {}
    const out: Record<string, string | number | boolean> = {}
    for (const [key, value] of Object.entries(metadata)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            out[key] = value
        }
    }
    return out
}

export function normalizeHitlRequest(raw: unknown): FEHitlRequest | null {
    if (!isRecord(raw)) return null
    const id = toStringOrNull(raw.id)
    const type = raw.type
    if (!id || (type !== 'approval' && type !== 'ask' && type !== 'choice')) return null
    const status = raw.status
    return {
        id,
        type,
        title: typeof raw.title === 'string' ? raw.title : 'Permission required',
        description: typeof raw.description === 'string' ? raw.description : null,
        correlationId: toStringOrNull(raw.correlationId ?? raw.correlationID),
        workspaceId: toStringOrNull(raw.workspaceId),
        chatId: typeof raw.chatId === 'string' ? raw.chatId : '',
        executionId: toStringOrNull(raw.executionId ?? raw.executionID),
        metadata: normalizeMetadata(raw.metadata),
        status:
            status === 'resolved' || status === 'expired' || status === 'cancelled'
                ? status
                : 'pending',
        createdAt: toStringOrNull(raw.createdAt),
        expiresAt: toStringOrNull(raw.expiresAt),
        payload: normalizeHitlPayload(raw.payload),
    }
}

export function parseHitlEvent(raw: string): FEHitlEvent | null {
    let parsed: unknown
    try {
        parsed = JSON.parse(raw) as unknown
    } catch {
        return null
    }
    if (!isRecord(parsed) || typeof parsed.type !== 'string') return null
    if (
        parsed.type === 'request' ||
        parsed.type === 'resolved' ||
        parsed.type === 'cancelled' ||
        parsed.type === 'expired'
    ) {
        return parsed as FEHitlEvent
    }
    return null
}
