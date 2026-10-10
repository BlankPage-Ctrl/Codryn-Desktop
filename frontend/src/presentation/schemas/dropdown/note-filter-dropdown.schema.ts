import type {
    NoteFilterState,
    NoteGroupBy,
    NoteModified,
    NoteSort,
} from '@/presentation/components/notes/resolver/filterNotes'
import { DEFAULT_NOTE_FILTER } from '@/presentation/components/notes/resolver/filterNotes'

export interface NoteFilterOption<T extends string> {
    value: T
    label: string
}

export const NOTE_SORT_OPTIONS: NoteFilterOption<NoteSort>[] = [
    { value: 'manual', label: 'Manual order' },
    { value: 'latest', label: 'Latest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
]

export const NOTE_MODIFIED_OPTIONS: NoteFilterOption<NoteModified>[] = [
    { value: 'any', label: 'Any time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 days' },
    { value: 'month', label: 'Last 30 days' },
]

export const NOTE_GROUP_OPTIONS: NoteFilterOption<NoteGroupBy>[] = [
    { value: 'none', label: 'None' },
    { value: 'category', label: 'Category' },
]

export const SORT_BY = 'sort'
export const MODIFIED_BY = 'modified'
export const GROUP_BY = 'group'

export const RESET_FILTER_VALUE = 'reset'

export function applyNoteFilterValue(filter: NoteFilterState, value: string): NoteFilterState {
    if (value === RESET_FILTER_VALUE) {
        return { ...DEFAULT_NOTE_FILTER, search: filter.search }
    }
    const [prefix, option] = value.split(':')
    if (prefix === SORT_BY) return { ...filter, sort: option as NoteSort }
    if (prefix === MODIFIED_BY) return { ...filter, modified: option as NoteModified }
    if (prefix === GROUP_BY) return { ...filter, group: option as NoteGroupBy }
    return filter
}
