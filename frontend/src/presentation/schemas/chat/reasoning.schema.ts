import { Brain } from '@iconoir/vue'
import type { BlockPartSchema } from '@/presentation/components/blockpart'

export interface ReasoningSchemaParams {
    text: string
    state?: string
    partId?: string
}

export function createReasoningSchema(params: ReasoningSchemaParams): BlockPartSchema {
    const isRunning = params.state === 'streaming'

    return {
        title: 'Thinking',
        icon: Brain,
        variant: 'default',
        collapsible: true,
        defaultExpanded: false,
        viewToggle: false,
        defaultView: 'source',
        status: isRunning ? 'streaming' : 'done',
        ...(params.partId !== undefined ? { persistenceKey: `reasoning:${params.partId}` } : {}),
        source: {
            data: params.text,
            format: 'text',
        },
    }
}
