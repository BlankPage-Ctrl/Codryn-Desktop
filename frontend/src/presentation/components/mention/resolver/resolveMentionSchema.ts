import type { MentionSchema, ResolvedMention } from '../types/mention.types'

export function resolveMentionSchema(schema: MentionSchema): ResolvedMention {
    return {
        query: schema.query,
        items: schema.items ?? [],
        visible: !!schema.visible,
        activeIndex: schema.activeIndex ?? 0,
        loading: !!schema.loading,
        grouped: !!schema.grouped,
        emptyMessage: schema.emptyMessage ?? 'No results',
        onSelect: schema.onSelect,
        onClose: schema.onClose,
    }
}
