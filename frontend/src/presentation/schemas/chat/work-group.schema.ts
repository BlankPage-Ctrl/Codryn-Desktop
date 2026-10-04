import { Okrs, Tools } from '@iconoir/vue'
import type { BlockPartSchema } from '@/presentation/components/blockpart'

export interface ToolCallGroupSchemaParams {
    count: number
    running: number
    failed: number
    statusText: string
    defaultExpanded: boolean
    groupId?: string
}

export interface WorkLogSchemaParams {
    stepCount: number
    toolCount: number
    statusText: string
    defaultExpanded: boolean
    worklogId?: string
}

function pluralize(count: number, singular: string): string {
    return `${count} ${singular}${count === 1 ? '' : 's'}`
}

export function createToolCallGroupSchema(params: ToolCallGroupSchemaParams): BlockPartSchema {
    return {
        title: `${pluralize(params.count, 'tool')} · ${params.statusText}`,
        icon: Tools,
        variant: 'default',
        collapsible: true,
        defaultExpanded: params.defaultExpanded,
        viewToggle: false,
        defaultView: 'preview',
        status: params.running > 0 ? 'streaming' : 'done',
        ...(params.groupId !== undefined ? { persistenceKey: `toolgroup:${params.groupId}` } : {}),
    }
}

export function createWorkLogSchema(params: WorkLogSchemaParams): BlockPartSchema {
    return {
        title: `Call ${pluralize(params.toolCount, 'tool')} and ${pluralize(params.stepCount, 'step')}`,
        icon: Okrs,
        variant: 'default',
        collapsible: true,
        defaultExpanded: params.defaultExpanded,
        viewToggle: false,
        defaultView: 'preview',
        status: 'done',
        ...(params.worklogId !== undefined
            ? { persistenceKey: `worklog:${params.worklogId}` }
            : {}),
    }
}
