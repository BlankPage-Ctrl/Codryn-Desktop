import type { MentionItem } from '@/core/entities/mention'

export interface MentionSchema {
    query: string
    items: MentionItem[]
    visible: boolean
    activeIndex: number
    loading?: boolean
    grouped?: boolean
    emptyMessage?: string
    onSelect?: (item: MentionItem) => void
    onClose?: () => void
}

export interface ResolvedMention {
    query: string
    items: MentionItem[]
    visible: boolean
    activeIndex: number
    loading: boolean
    grouped: boolean
    emptyMessage: string
    onSelect?: (item: MentionItem) => void
    onClose?: () => void
}
