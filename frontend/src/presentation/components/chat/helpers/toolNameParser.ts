import type { FeedBlock, FeedMessage } from '@/core/entities'
import { isHiddenToolName } from './knownTools'

type UnknownPart = Record<string, unknown>

function asRecord(part: unknown): UnknownPart | null {
    if (part === null || part === undefined) return null
    if (typeof part !== 'object') return null
    return part as UnknownPart
}

function getStringField(record: UnknownPart, keys: string[]): string | null {
    for (const key of keys) {
        const value = record[key]
        if (typeof value === 'string' && value.length > 0) return value
    }
    return null
}

export function parseToolName(part: unknown): string | null {
    const record = asRecord(part)
    if (!record) return null

    // Feed work blocks carry the tool name as `implement`.
    const implement = getStringField(record, ['implement'])
    const kind = getStringField(record, ['kind'])
    if (kind === 'work' && implement) return implement

    // 1. dynamic-tool or any part with explicit toolName string
    const toolNameField = getStringField(record, ['toolName'])
    const typeField = getStringField(record, ['type'])

    if (typeField === 'dynamic-tool' && toolNameField) {
        return toolNameField
    }

    // 2. tool-call schema part with toolName
    if (toolNameField) {
        if (
            typeField === 'tool-call' ||
            typeField === 'dynamic-tool' ||
            (typeField !== null && typeField.startsWith('tool-'))
        ) {
            return toolNameField
        }
        if (hasToolCallId(record)) {
            return toolNameField
        }
    }

    // 3. Legacy prefix: `tool-list_files` -> `list_files`
    if (typeField !== null && typeField.startsWith('tool-')) {
        const sliced = typeField.slice(5)
        if (sliced.length > 0) return sliced
    }

    return null
}

function hasToolCallId(record: UnknownPart): boolean {
    return getStringField(record, ['toolCallId', 'ToolCallId', 'tool_call_id']) !== null
}

export function parseToolCallId(part: unknown): string | null {
    const record = asRecord(part)
    if (!record) return null
    return getStringField(record, ['toolCallId', 'callId', 'ToolCallId', 'tool_call_id', 'id'])
}

export function parseToolCall(part: unknown): { toolName: string; toolCallId: string } | null {
    const toolName = parseToolName(part)
    if (toolName === null) return null
    const toolCallId = parseToolCallId(part)
    if (toolCallId === null) return null
    return { toolName, toolCallId }
}

export function isToolPart(part: unknown): boolean {
    return parseToolName(part) !== null
}

export function getToolNamesFromBlocks(blocks: FeedBlock[]): string[] {
    if (!Array.isArray(blocks)) return []
    const names: string[] = []
    for (const block of blocks) {
        if (block.kind === 'work') {
            if (isHiddenToolName(block.implement)) continue
            names.push(block.implement)
            continue
        }
        const name = parseToolName(block)
        if (name !== null) {
            if (isHiddenToolName(name)) continue
            names.push(name)
        }
    }
    return names
}

/** Alias kept for the barrel export: feed blocks replaced message parts. */
export const getToolNamesFromParts = getToolNamesFromBlocks

export function getToolNamesFromMessage(message: FeedMessage): string[] {
    return getToolNamesFromBlocks(message.blocks ?? [])
}

export function getToolNamesFromMessages(messages: FeedMessage[]): string[] {
    const seen = new Set<string>()
    const ordered: string[] = []
    for (const msg of messages) {
        for (const name of getToolNamesFromMessage(msg)) {
            if (!seen.has(name)) {
                seen.add(name)
                ordered.push(name)
            }
        }
    }
    return ordered
}

export function getToolCallsFromMessages(
    messages: FeedMessage[],
): Array<{ toolName: string; toolCallId: string; state?: string }> {
    const seen = new Set<string>()
    const out: Array<{ toolName: string; toolCallId: string; state?: string }> = []
    for (const msg of messages) {
        for (const block of msg.blocks ?? []) {
            if (block.kind === 'work') {
                if (isHiddenToolName(block.implement)) continue
                if (seen.has(block.callId)) continue
                seen.add(block.callId)
                out.push({
                    toolName: block.implement,
                    toolCallId: block.callId,
                    state: block.state,
                })
                continue
            }
            const parsed = parseToolCall(block)
            if (!parsed) continue
            if (isHiddenToolName(parsed.toolName)) continue
            if (seen.has(parsed.toolCallId)) continue
            seen.add(parsed.toolCallId)
            const record = asRecord(block)
            const state = record ? (getStringField(record, ['state']) ?? undefined) : undefined
            out.push({ ...parsed, state: state ?? undefined })
        }
    }
    return out
}

export function getAllToolNamesFromMessages(messages: FeedMessage[]): string[] {
    const out: string[] = []
    for (const msg of messages) {
        out.push(...getToolNamesFromMessage(msg))
    }
    return out
}
