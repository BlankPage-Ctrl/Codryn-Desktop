import type {
    TextPartSchema,
    ReasoningPartSchema,
    ToolCallPartSchema,
    ToolCallGroupPartSchema,
    WorkLogPartSchema,
    SourcePartSchema,
    FilePartSchema,
    ToolData,
    StepIndicatorSchema,
    MessagePartSchema,
} from '../types/schema'
import type {
    ResolvedTextPart,
    ResolvedReasoningPart,
    ResolvedToolCallPart,
    ResolvedToolCallGroup,
    ResolvedWorkLog,
    ResolvedSourcePart,
    ResolvedFilePart,
    ResolvedStepIndicator,
} from '../types/resolved'
import type { FeedBlock, FeedMessage } from '@/core/entities'
import { isHiddenToolName } from '../helpers/knownTools'

export function resolveTextPartSchema(
    schema: TextPartSchema,
    defaults?: { fontSize?: number; lineHeight?: number },
): ResolvedTextPart {
    return {
        text: schema.text,
        state: schema.state,
        fontSize: schema.fontSize ?? defaults?.fontSize ?? 14,
        lineHeight: schema.lineHeight ?? defaults?.lineHeight ?? 1.7,
    }
}

export function resolveReasoningPartSchema(schema: ReasoningPartSchema): ResolvedReasoningPart {
    const isRunning = schema.state === 'streaming'
    const isDone = !schema.state || schema.state === 'done'

    return {
        text: schema.text,
        state: schema.state,
        isRunning,
        isDone,
        statusText: isRunning ? 'Running...' : 'Done',
    }
}

export function resolveToolCallPartSchema(schema: ToolCallPartSchema): ResolvedToolCallPart {
    const isRunning = schema.state === 'queued' || schema.state === 'active'
    const isDone = schema.state === 'ok'
    const isError = schema.state === 'bad'

    return {
        toolName: schema.toolName,
        toolCallId: schema.toolCallId,
        state: schema.state,
        input: schema.input,
        output: schema.output,
        errorText: schema.errorText,
        ...(schema.frontend !== undefined ? { frontend: schema.frontend } : {}),
        isRunning,
        isDone,
        isError,
        statusText: isRunning ? 'Running...' : isError ? 'Failed' : 'Done',
    }
}

function getSourceIcon(mediaType?: string): string {
    if (mediaType) {
        if (mediaType.startsWith('image/')) return '🖼️'
        if (mediaType.startsWith('text/')) return '📄'
        if (mediaType.startsWith('application/pdf')) return '📕'
    }
    return '🔗'
}

export function resolveSourcePartSchema(schema: SourcePartSchema): ResolvedSourcePart {
    return {
        sourceId: schema.sourceId,
        url: schema.url,
        title: schema.title,
        mediaType: schema.mediaType,
        icon: getSourceIcon(schema.mediaType),
        displayTitle: schema.title || schema.url || schema.sourceId,
        isLink: !!schema.url,
    }
}

function getFileIcon(mediaType: string): string {
    if (mediaType.startsWith('image/')) return '🖼️'
    if (mediaType.startsWith('text/')) return '📄'
    if (mediaType.startsWith('application/')) return '📦'
    if (mediaType.startsWith('audio/')) return '🎵'
    if (mediaType.startsWith('video/')) return '🎬'
    return '📎'
}

export function resolveFilePartSchema(schema: FilePartSchema): ResolvedFilePart {
    return {
        mediaType: schema.mediaType,
        url: schema.url,
        filename: schema.filename,
        icon: getFileIcon(schema.mediaType),
        displayName: schema.filename || schema.url || 'file',
        typeLabel: schema.mediaType.split('/').pop() || '',
        isLink: !!schema.url,
    }
}

export function resolveStepIndicatorSchema(schema: StepIndicatorSchema): ResolvedStepIndicator {
    return {
        label: schema.label,
    }
}

function firstToolData(notices: unknown[]): ToolData | undefined {
    for (const notice of notices) {
        if (notice !== null && typeof notice === 'object' && 'toolCallId' in notice) {
            return notice as ToolData
        }
    }
    return undefined
}

function toolPartId(part: ToolCallPartSchema): string {
    return part.partId ?? part.toolCallId
}

function partStableId(part: MessagePartSchema): string {
    switch (part.type) {
        case 'tool-call':
            return toolPartId(part)
        case 'tool-call-group':
            if (part.partId) return part.partId
            return `group:${part.items.map(toolPartId).join('+')}`
        case 'work-log':
            if (part.partId) return part.partId
            return `worklog:${part.stepCount}:${part.items.map(partStableId).join('+')}`
        case 'source':
            return part.partId ?? `source:${part.sourceId}`
        case 'file':
            return part.partId ?? `file:${part.url ?? part.filename ?? part.mediaType}`
        case 'step-start':
            return part.partId ?? `step:${part.label ?? ''}`
        case 'text':
            return part.partId ?? `text:${part.text.slice(0, 32)}`
        case 'reasoning':
            return part.partId ?? `reasoning:${part.text.slice(0, 32)}`
    }
}

export function getMessagePartStableId(part: MessagePartSchema): string {
    return partStableId(part)
}

function blockToPart(
    block: FeedBlock,
    defaults?: { fontSize?: number; lineHeight?: number },
): MessagePartSchema | null {
    switch (block.kind) {
        case 'text':
            if (block.text === '') return null
            return {
                type: 'text',
                text: block.text,
                state: block.closed ? 'done' : 'streaming',
                fontSize: defaults?.fontSize,
                lineHeight: defaults?.lineHeight,
                partId: block.sliceId,
            }
        case 'think':
            if (block.text === '') return null
            return {
                type: 'reasoning',
                text: block.text,
                state: block.closed ? 'done' : 'streaming',
                partId: block.sliceId,
            }
        case 'work': {
            if (isHiddenToolName(block.implement)) return null
            return {
                type: 'tool-call',
                toolName: block.implement,
                toolCallId: block.callId,
                state: block.state,
                partId: block.sliceId ?? block.callId,
                ...(block.input !== undefined ? { input: block.input } : {}),
                ...(block.output !== undefined ? { output: block.output } : {}),
                ...(block.errorText !== undefined ? { errorText: block.errorText } : {}),
                ...(firstToolData(block.notices) !== undefined
                    ? { frontend: firstToolData(block.notices) }
                    : {}),
            }
        }
        case 'asset':
            if (block.assetKind === 'blob') {
                return {
                    type: 'file',
                    mediaType: block.mediaType ?? 'application/octet-stream',
                    partId: block.sliceId,
                    ...(block.url !== undefined ? { url: block.url } : {}),
                    ...(block.filename !== undefined ? { filename: block.filename } : {}),
                }
            }
            return {
                type: 'source',
                sourceId: block.sliceId,
                partId: block.sliceId,
                ...(block.url !== undefined ? { url: block.url } : {}),
                ...(block.title !== undefined ? { title: block.title } : {}),
                ...(block.mediaType !== undefined ? { mediaType: block.mediaType } : {}),
            }
        case 'stage':
            return {
                type: 'step-start',
                partId: `stage:${block.stage}`,
                ...(block.landed !== undefined
                    ? { label: `Stage ${block.stage} · ${block.landed}` }
                    : { label: `Stage ${block.stage}` }),
            }
    }
}

export function resolveMessagePart(
    block: FeedBlock,
    defaults?: { fontSize?: number; lineHeight?: number },
): MessagePartSchema | null {
    return blockToPart(block, defaults)
}

export function resolveMessageParts(
    blocks: FeedBlock[] | undefined,
    defaults?: { fontSize?: number; lineHeight?: number },
): MessagePartSchema[] {
    if (!blocks || blocks.length === 0) return []
    // Identity preservation: feed.reducer never mutates blocks in place,
    // so the same array reference means the same content. Reusing the
    // previous part objects lets v-for keys + v-memo skip every part
    // that did not change, so only the streaming part re-renders.
    const cached = partsCache.get(blocks)
    if (
        cached &&
        cached.fontSize === defaults?.fontSize &&
        cached.lineHeight === defaults?.lineHeight
    ) {
        return cached.result
    }
    const flat: MessagePartSchema[] = []
    for (const block of blocks) {
        const part = blockToPart(block, defaults)
        if (part !== null) flat.push(part)
    }
    const grouped = groupConsecutiveToolCalls(flat)
    const result = maybeWrapWorkLog(grouped, loopFinishedStepCount(blocks))
    partsCache.set(blocks, {
        fontSize: defaults?.fontSize,
        lineHeight: defaults?.lineHeight,
        result,
    })
    return result
}

interface PartsCacheEntry {
    fontSize?: number
    lineHeight?: number
    result: MessagePartSchema[]
}

/** WeakMap so entries are GC'd together with their message blocks. */
const partsCache = new WeakMap<FeedBlock[], PartsCacheEntry>()

export function resolveMessageBlocks(
    message: FeedMessage,
    defaults?: { fontSize?: number; lineHeight?: number },
): MessagePartSchema[] {
    return resolveMessageParts(message.blocks, defaults)
}

/** Groups of more than this many tools start collapsed. */
export const TOOL_GROUP_COLLAPSE_THRESHOLD = 2

function flushToolRun(run: ToolCallPartSchema[], out: MessagePartSchema[]): void {
    if (run.length === 0) return
    if (run.length === 1) {
        out.push({ type: 'tool-call', ...run[0]! })
        return
    }
    const items = [...run]
    out.push({
        type: 'tool-call-group',
        items,
        partId: `group:${items.map(toolPartId).join('+')}`,
    })
}

/** Merges consecutive tool-call parts into tool-call-group parts. Single calls stay flat. */
export function groupConsecutiveToolCalls(parts: MessagePartSchema[]): MessagePartSchema[] {
    const out: MessagePartSchema[] = []
    let run: ToolCallPartSchema[] = []
    for (const part of parts) {
        if (part.type === 'tool-call') {
            const { type: _type, ...rest } = part
            run.push(rest)
            continue
        }
        flushToolRun(run, out)
        run = []
        out.push(part)
    }
    flushToolRun(run, out)
    return out
}

/**
 * Returns the stage count when the agent loop has finished, else null.
 * Finished means the latest stage block landed with a reason other than
 * 'tool-calls' (usually 'stop', when the model emits the final text).
 */
export function loopFinishedStepCount(blocks: FeedBlock[] | undefined): number | null {
    if (!blocks) return null
    let maxStage = -1
    let landed: string | undefined
    for (const block of blocks) {
        if (block.kind !== 'stage') continue
        if (block.stage > maxStage) {
            maxStage = block.stage
            landed = block.landed
        } else if (block.stage === maxStage && block.landed !== undefined) {
            landed = block.landed
        }
    }
    if (maxStage < 0 || landed === undefined || landed === 'tool-calls') return null
    const stages = new Set<number>()
    for (const block of blocks) {
        if (block.kind === 'stage') stages.add(block.stage)
    }
    return stages.size
}

function isWorkPart(part: MessagePartSchema): boolean {
    return part.type === 'reasoning' || part.type === 'tool-call' || part.type === 'tool-call-group'
}

/**
 * Wraps everything before the final text into one work-log group once the
 * loop is finished. The final answer text (and anything after it) stays out.
 */
export function maybeWrapWorkLog(
    parts: MessagePartSchema[],
    stepCount: number | null,
): MessagePartSchema[] {
    if (stepCount === null) return parts
    let lastTextIdx = -1
    for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i]!.type === 'text') {
            lastTextIdx = i
            break
        }
    }
    if (lastTextIdx <= 0) return parts
    const head = parts.slice(0, lastTextIdx)
    if (!head.some(isWorkPart)) return parts
    return [
        {
            type: 'work-log',
            items: head,
            stepCount,
            partId: `worklog:${stepCount}:${head.map(partStableId).join('+')}`,
        },
        ...parts.slice(lastTextIdx),
    ]
}

export function resolveToolCallGroupPartSchema(
    schema: ToolCallGroupPartSchema,
): ResolvedToolCallGroup {
    let running = 0
    let done = 0
    let failed = 0
    for (const item of schema.items) {
        if (item.state === 'queued' || item.state === 'active') running++
        else if (item.state === 'bad') failed++
        else done++
    }
    return {
        count: schema.items.length,
        running,
        done,
        failed,
        statusText: running > 0 ? 'Running...' : failed > 0 ? `${failed} failed` : 'Done',
        defaultExpanded: schema.items.length <= TOOL_GROUP_COLLAPSE_THRESHOLD,
    }
}

export function resolveWorkLogPartSchema(schema: WorkLogPartSchema): ResolvedWorkLog {
    let tools = 0
    let think = 0
    let running = 0
    let failed = 0
    for (const part of schema.items) {
        if (part.type === 'tool-call-group') {
            for (const item of part.items) {
                tools++
                if (item.state === 'queued' || item.state === 'active') running++
                else if (item.state === 'bad') failed++
            }
        } else if (part.type === 'tool-call') {
            tools++
            if (part.state === 'queued' || part.state === 'active') running++
            else if (part.state === 'bad') failed++
        } else if (part.type === 'reasoning') {
            think++
            if (part.state === 'streaming') running++
        }
    }
    return {
        stepCount: schema.stepCount,
        toolCount: tools,
        thinkCount: think,
        running,
        failed,
        statusText: running > 0 ? 'Running...' : failed > 0 ? `${failed} failed` : 'Done',
        defaultExpanded: false,
    }
}
