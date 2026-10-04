import type { Note, Category, Priority } from '@/core/entities'

export interface NotesTabSchema {
    note: Note
    categories: Category[]
    dirty?: boolean
    saving?: boolean
    savedAt?: string | null
    autofocusName?: boolean
    onNameCommit?: (name: string) => void
    onDescCommit?: (desc: string) => void
    onDetailsCommit?: (details: string) => void
    onPriorityChange?: (priority: Priority) => void
    onCategoryChange?: (categoryId: string) => void
    onCreateCategory?: () => void
    onSave?: () => void
}
