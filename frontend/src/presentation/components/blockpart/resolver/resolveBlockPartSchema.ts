import type { BlockPartSchema, ResolvedBlockPart } from '../types/schema'

export function resolveBlockPartSchema(schema: BlockPartSchema): ResolvedBlockPart {
    const hasPreview = !!schema.preview?.component
    const hasSource = !!schema.source?.component || schema.source?.data !== undefined

    return {
        title: schema.title ?? '',
        icon: schema.icon,
        variant: schema.variant ?? 'default',
        collapsible: schema.collapsible ?? true,
        expanded: schema.defaultExpanded ?? true,
        viewToggle: schema.viewToggle ?? false,
        viewMode: schema.defaultView,
        status: schema.status ?? 'idle',
        actions: schema.actions ?? [],
        hasPreview,
        hasSource,
        preview: schema.preview,
        source: schema.source,
        ...(schema.persistenceKey !== undefined ? { persistenceKey: schema.persistenceKey } : {}),
    }
}
