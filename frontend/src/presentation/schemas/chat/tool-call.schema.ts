import {
    Wrench,
    Eye,
    EditPencil,
    Folder,
    Terminal,
    Book,
    Search,
    Tree,
    Plus,
    PathArrow,
    InputSearch,
} from '@iconoir/vue'
import type { Component } from 'vue'
import type { BlockPartSchema } from '@/presentation/components/blockpart'
import { TOOL_LABELS } from '@/presentation/components/chat/helpers/knownTools'

export interface ToolCallSchemaParams {
    toolName: string
    toolCallId?: string
    state: string
    input?: unknown
    output?: unknown
    errorText?: string
}

const TOOL_VIEW_TOGGLE: Record<string, boolean> = {
    list_files: false,
    read_file: false,
    run_shell: false,
    edit_file: false,
    create_file: false,
    insight_search: false,
    insight_graph: false,
}

const TOOL_EXPANDED: Record<string, boolean> = {
    list_files: false,
    read_file: false,
    run_shell: true,
    edit_file: true,
    create_file: true,
    insight_search: false,
    insight_graph: false,
}

const TOOL_ICONS: Record<string, Component> = {
    read_file: Eye,
    edit_file: EditPencil,
    create_file: Plus,
    list_files: Folder,
    run_shell: Terminal,
    skill: Book,
    skill_list: Book,
    insight_search: Search,
    insight_graph: Tree,
    insight_trace: PathArrow,
    grep: InputSearch,
}

function getSkillTitle(input: unknown): string {
    if (input && typeof input === 'object' && 'name' in input) {
        const name = (input as Record<string, unknown>).name
        if (typeof name === 'string' && name.trim().length > 0) {
            return `Reading ${name.trim()}`
        }
    }
    return 'Reading Skill'
}

function getInsightSearchTitle(input: unknown): string | null {
    if (input && typeof input === 'object' && 'query' in input) {
        const query = (input as Record<string, unknown>).query
        if (typeof query === 'string' && query.trim().length > 0) {
            const q = query.trim().slice(0, 80)
            return `Search ${q}`
        }
    }
    return null
}

function extractGraphName(id: string): string {
    if (!id || typeof id !== 'string') return ''
    // e.g. "typescript:src/database/mockDb.ts:function:insertUser:1"
    // or "func:MyFunc@src/foo.ts:10-20"
    const trimmed = id.trim()
    if (trimmed.length === 0) return ''
    // handle @-form first: "func:MyFunc@src/foo.ts:10-20" -> MyFunc
    if (trimmed.includes('@')) {
        const beforeAt = trimmed.split('@')[0] ?? ''
        const lastColon = beforeAt.lastIndexOf(':')
        if (lastColon >= 0) {
            const name = beforeAt.slice(lastColon + 1).trim()
            if (name) return name
        }
    }
    const parts = trimmed.split(':')
    if (parts.length >= 2) {
        const last = (parts[parts.length - 1] ?? '').trim()
        const isNumeric = /^\d+(-\d+)?$/.test(last)
        const idx = isNumeric ? parts.length - 2 : parts.length - 1
        const candidate = (parts[idx] ?? '').trim()
        // candidate may still contain "/" for file path, but name is identifier without slash
        if (candidate && !candidate.includes('/') && !candidate.includes('.')) return candidate
        if (candidate) {
            // fallback: return last segment after "/"
            const seg = candidate.split('/').pop()?.trim()
            if (seg) return seg
            return candidate
        }
    }
    return trimmed
}

function getInsightGraphTitle(input: unknown): string | null {
    if (input && typeof input === 'object' && 'id' in input) {
        const id = (input as Record<string, unknown>).id
        if (typeof id === 'string' && id.trim().length > 0) {
            const name = extractGraphName(id)
            if (name) return `Inspect ${name} Tree`
        }
    }
    return null
}

function getInsightTraceTitle(input: unknown): string | null {
    if (input && typeof input === 'object') {
        const rec = input as Record<string, unknown>
        const from = typeof rec.from === 'string' ? rec.from.trim().slice(0, 40) : ''
        const to = typeof rec.to === 'string' ? rec.to.trim().slice(0, 40) : ''
        if (from && to) return `Trace ${from} → ${to}`
        const query = rec.query
        if (typeof query === 'string' && query.trim().length > 0) {
            return `Trace ${query.trim().slice(0, 80)}`
        }
    }
    return null
}

function getGrepTitle(input: unknown): string | null {
    if (input && typeof input === 'object' && 'pattern' in input) {
        const pattern = (input as Record<string, unknown>).pattern
        if (typeof pattern === 'string' && pattern.trim().length > 0) {
            return `Grep "${pattern.trim().slice(0, 80)}"`
        }
    }
    return null
}

export function createToolCallSchema(params: ToolCallSchemaParams): BlockPartSchema {
    // Feed work states: queued | active (running) vs ok | bad (settled).
    const isRunning = params.state === 'queued' || params.state === 'active'
    const isSkill = params.toolName === 'skill'
    const isSearch = params.toolName === 'insight_search'
    const isGraph = params.toolName === 'insight_graph'
    const isTrace = params.toolName === 'insight_trace'
    const isGrep = params.toolName === 'grep'
    const isStatic = isSkill || isTrace || isGrep

    const title = isSkill
        ? getSkillTitle(params.input)
        : isSearch
          ? (getInsightSearchTitle(params.input) ??
            (TOOL_LABELS as Record<string, string>)[params.toolName] ??
            params.toolName)
          : isGraph
            ? (getInsightGraphTitle(params.input) ??
              (TOOL_LABELS as Record<string, string>)[params.toolName] ??
              params.toolName)
            : isTrace
              ? (getInsightTraceTitle(params.input) ??
                (TOOL_LABELS as Record<string, string>)[params.toolName] ??
                params.toolName)
              : isGrep
                ? (getGrepTitle(params.input) ??
                  (TOOL_LABELS as Record<string, string>)[params.toolName] ??
                  params.toolName)
                : ((TOOL_LABELS as Record<string, string>)[params.toolName] ?? params.toolName)

    return {
        title,
        icon: TOOL_ICONS[params.toolName] ?? Wrench,
        variant: 'default',
        collapsible: isStatic ? false : true,
        defaultExpanded: isStatic ? false : (TOOL_EXPANDED[params.toolName] ?? false),
        viewToggle: isStatic ? false : (TOOL_VIEW_TOGGLE[params.toolName] ?? false),
        defaultView: 'preview',
        status: isRunning ? 'streaming' : 'done',
        ...(params.toolCallId !== undefined ? { persistenceKey: `tool:${params.toolCallId}` } : {}),
        source: {
            data: {
                ...(params.input !== undefined && { input: params.input }),
                ...(params.output !== undefined && { output: params.output }),
                ...(params.errorText && { errorText: params.errorText }),
            },
            format: 'json',
        },
    }
}
