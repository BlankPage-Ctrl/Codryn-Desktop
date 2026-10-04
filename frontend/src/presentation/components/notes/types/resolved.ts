import type { NotesTabSchema } from './schema'

export interface ResolvedNotesTab {
    note: NotesTabSchema['note']
    categories: NotesTabSchema['categories']
    dirty: boolean
    saving: boolean
    savedAt: string | null
    autofocusName: boolean
    onNameCommit?: (name: string) => void
    onDescCommit?: (desc: string) => void
    onDetailsCommit?: (details: string) => void
    onPriorityChange?: (priority: NotesTabSchema['note']['priority']) => void
    onCategoryChange?: (categoryId: string) => void
    onCreateCategory?: () => void
    onSave?: () => void
}
