import type { Note } from '@/core/entities'
import type { CategoriesTabSchema, NotesTabSchema } from './schema'
import type { NoteFilterState } from '../resolver/filterNotes'

/**
 * One row stream for the list. A flat run is all notes, a grouped run is
 * headings followed by their notes, so a single component renders both.
 */
export type NoteListRow =
    | { kind: 'heading'; key: string; label: string; count: number }
    | { kind: 'note'; key: string; note: Note; active: boolean }

export interface ResolvedNoteList {
    search: string
    searchOpen: boolean
    countLabel: string
    searchActive: boolean
    categoriesOpen: boolean
    filter: {
        state: NoteFilterState
        active: boolean
    }
    rows: NoteListRow[]
    emptyMessage: string
    onSearch: (value: string) => void
    onCloseSearch: () => void
    onFilterSelect: (value: string) => void
}

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

export interface ResolvedCategoryRow {
    category: CategoriesTabSchema['categories'][number]
    noteCount: number
}

export interface ResolvedCategoriesTab {
    rows: ResolvedCategoryRow[]
    total: number
    error: string | null
    onCreate: () => void
    onRename: CategoriesTabSchema['onRename']
    onDelete: CategoriesTabSchema['onDelete']
}
