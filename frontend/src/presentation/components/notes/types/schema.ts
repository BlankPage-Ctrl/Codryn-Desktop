import type { Note, Category, Priority } from '@/core/entities'
import type { NoteFilterState } from '../resolver/filterNotes'

export interface NoteGroupItem {
    id: string
    name: string
    notes: Note[]
}

/** Filter menu state the note list hands to its header. */
export interface NoteListFilter {
    state: NoteFilterState
    active: boolean
}

export interface NoteListSchema {
    notes: Note[]
    categories: Category[]
    filter: NoteFilterState
    activeNoteId?: string
    searchOpen: boolean
    categoriesOpen: boolean
}

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

export interface CategoriesTabSchema {
    categories: Category[]
    counts: Record<string, number>
    error?: string | null
    onCreate: () => void
    onRename: (category: Category) => void
    onDelete: (category: Category) => void
}
