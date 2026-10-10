import type { NoteListSchema } from '../types/schema'
import type { NoteListRow, ResolvedNoteList } from '../types/resolved'
import { filterNotes, groupNotesByCategory, isFilterActive } from './filterNotes'

export interface NoteListHandlers {
    onSearch: (value: string) => void
    onCloseSearch: () => void
    onFilterSelect: (value: string) => void
}

function countLabel(shown: number, total: number): string {
    if (shown !== total) return `${shown} of ${total}`
    return total === 1 ? '1 note' : `${total} notes`
}

function emptyMessage(hasNotes: boolean, filtered: boolean): string {
    if (!hasNotes) return 'No notes yet'
    return filtered ? 'No notes match your filters' : 'No notes yet'
}

/**
 * Headings only appear when Group by Category is on. Everything else about
 * the list body is identical in both modes.
 */
function buildRows(schema: NoteListSchema): NoteListRow[] {
    const visible = filterNotes(schema.notes, schema.filter)
    const activeId = schema.activeNoteId

    if (schema.filter.group !== 'category') {
        return visible.map((note) => ({
            kind: 'note',
            key: note.id,
            note,
            active: note.id === activeId,
        }))
    }

    const rows: NoteListRow[] = []
    for (const group of groupNotesByCategory(visible, schema.categories)) {
        rows.push({
            kind: 'heading',
            key: `heading:${group.id}`,
            label: group.name,
            count: group.notes.length,
        })
        for (const note of group.notes) {
            rows.push({ kind: 'note', key: note.id, note, active: note.id === activeId })
        }
    }
    return rows
}

export function resolveNoteListSchema(
    schema: NoteListSchema,
    handlers: NoteListHandlers,
): ResolvedNoteList {
    const search = schema.filter.search
    const searchActive = search.trim().length > 0
    const filterActive = isFilterActive(schema.filter)
    const rows = buildRows(schema)

    return {
        search,
        searchOpen: schema.searchOpen,
        countLabel: countLabel(rows.filter((r) => r.kind === 'note').length, schema.notes.length),
        searchActive,
        categoriesOpen: schema.categoriesOpen,
        filter: {
            state: schema.filter,
            active: filterActive,
        },
        rows,
        emptyMessage: emptyMessage(schema.notes.length > 0, searchActive || filterActive),
        onSearch: handlers.onSearch,
        onCloseSearch: handlers.onCloseSearch,
        onFilterSelect: handlers.onFilterSelect,
    }
}
