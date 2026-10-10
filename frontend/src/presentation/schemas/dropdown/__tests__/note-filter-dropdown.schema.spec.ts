import { describe, it, expect } from 'vitest'
import {
    GROUP_BY,
    MODIFIED_BY,
    NOTE_GROUP_OPTIONS,
    NOTE_MODIFIED_OPTIONS,
    NOTE_SORT_OPTIONS,
    RESET_FILTER_VALUE,
    SORT_BY,
    applyNoteFilterValue,
} from '../note-filter-dropdown.schema'
import { DEFAULT_NOTE_FILTER, type NoteFilterState } from '@/presentation/components/notes'

function makeFilter(overrides: Partial<NoteFilterState> = {}): NoteFilterState {
    return { ...DEFAULT_NOTE_FILTER, ...overrides }
}

describe('note filter options', () => {
    it('offers every sort, modified and group option', () => {
        expect(NOTE_SORT_OPTIONS.map((o) => o.value)).toEqual([
            'manual',
            'latest',
            'oldest',
            'name-asc',
            'name-desc',
        ])
        expect(NOTE_MODIFIED_OPTIONS.map((o) => o.value)).toEqual(['any', 'today', 'week', 'month'])
        expect(NOTE_GROUP_OPTIONS.map((o) => o.value)).toEqual(['none', 'category'])
    })

    it('are end user facing', () => {
        expect([
            ...NOTE_SORT_OPTIONS.map((o) => o.label),
            ...NOTE_MODIFIED_OPTIONS.map((o) => o.label),
            ...NOTE_GROUP_OPTIONS.map((o) => o.label),
        ]).toEqual([
            'Manual order',
            'Latest',
            'Oldest',
            'Name (A-Z)',
            'Name (Z-A)',
            'Any time',
            'Today',
            'Last 7 days',
            'Last 30 days',
            'None',
            'Category',
        ])
    })

    it('carries no category names', () => {
        const values = [
            ...NOTE_SORT_OPTIONS,
            ...NOTE_MODIFIED_OPTIONS,
            ...NOTE_GROUP_OPTIONS,
        ].map((o) => o.value)
        expect(values).not.toContain('cat-work')
    })
})

describe('applyNoteFilterValue', () => {
    it('sets the sort', () => {
        expect(applyNoteFilterValue(makeFilter(), `${SORT_BY}:name-desc`).sort).toBe('name-desc')
    })

    it('sets the date window', () => {
        expect(applyNoteFilterValue(makeFilter(), `${MODIFIED_BY}:month`).modified).toBe('month')
    })

    it('sets the grouping', () => {
        expect(applyNoteFilterValue(makeFilter(), `${GROUP_BY}:category`).group).toBe('category')
    })

    it('clears everything except the search term', () => {
        const applied = applyNoteFilterValue(
            makeFilter({ search: 'road', sort: 'latest', modified: 'today', group: 'category' }),
            RESET_FILTER_VALUE,
        )
        expect(applied).toEqual({ ...DEFAULT_NOTE_FILTER, search: 'road' })
    })

    it('keeps the other fields untouched', () => {
        const applied = applyNoteFilterValue(
            makeFilter({ search: 'road', modified: 'week' }),
            `${SORT_BY}:oldest`,
        )
        expect(applied.search).toBe('road')
        expect(applied.modified).toBe('week')
        expect(applied.group).toBe('none')
    })

    it('ignores an unknown value', () => {
        const filter = makeFilter({ sort: 'latest' })
        expect(applyNoteFilterValue(filter, 'nope:nope')).toBe(filter)
    })
})
