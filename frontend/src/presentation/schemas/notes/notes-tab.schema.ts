import type { Note, Category, Priority } from '@/core/entities'
import type { NotesTabSchema } from '@/presentation/components/notes'

export interface NotesTabParams {
    note: Note
    categories: Category[]
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

export function createNotesTabSchema(params: NotesTabParams): NotesTabSchema {
    return {
        note: params.note,
        categories: params.categories,
        saving: params.saving,
        savedAt: params.savedAt,
        autofocusName: params.autofocusName,
        onNameCommit: params.onNameCommit,
        onDescCommit: params.onDescCommit,
        onDetailsCommit: params.onDetailsCommit,
        onPriorityChange: params.onPriorityChange,
        onCategoryChange: params.onCategoryChange,
        onCreateCategory: params.onCreateCategory,
        onSave: params.onSave,
    }
}
