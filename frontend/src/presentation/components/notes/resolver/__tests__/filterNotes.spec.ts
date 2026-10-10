import { describe, it, expect } from 'vitest'
import {
    DEFAULT_NOTE_FILTER,
    UNCATEGORIZED_ID,
    compareByRank,
    countNotesByCategory,
    filterNotes,
    groupNotesByCategory,
    isFilterActive,
    isSearchActive,
    matchesModified,
    matchesSearch,
    sortNotes,
    type NoteFilterState,
    type NoteModified,
} from '../filterNotes'
import type { Note, Category } from '@/core/entities'

const NOW = new Date('2026-03-10T12:00:00.000Z')
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

/** Local midnight of NOW, matching how matchesModified rolls over a day. */
function startOfTodayMs(base: Date): number {
    const start = new Date(base)
    start.setHours(0, 0, 0, 0)
    return start.getTime()
}

const TODAY_START_MS = startOfTodayMs(NOW)
const EARLY_TODAY = new Date(TODAY_START_MS + HOUR_MS).toISOString()
const YESTERDAY = new Date(TODAY_START_MS - 1).toISOString()
const A_WEEK_AGO = new Date(NOW.getTime() - 7 * DAY_MS).toISOString()
const A_DAY_BEFORE_THAT = new Date(NOW.getTime() - 8 * DAY_MS).toISOString()
const A_MONTH_AGO = new Date(NOW.getTime() - 30 * DAY_MS).toISOString()
const LONG_AGO = new Date(NOW.getTime() - 60 * DAY_MS).toISOString()

function makeNote(overrides: Partial<Note> = {}): Note {
    return {
        id: 'note-1',
        name: 'Groceries',
        category_id: 'cat-work',
        desc: 'weekly list',
        details: '',
        rank: '0|hzzzzz:',
        priority: 'medium',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-03-01T00:00:00.000Z',
        version: 1,
        ...overrides,
    }
}

function makeCategory(overrides: Partial<Category> = {}): Category {
    return {
        id: 'cat-work',
        name: 'Work',
        color: null,
        is_default: false,
        created_at: '2026-01-01T00:00:00.000Z',
        ...overrides,
    }
}

function makeFilter(overrides: Partial<NoteFilterState> = {}): NoteFilterState {
    return { ...DEFAULT_NOTE_FILTER, ...overrides }
}

describe('DEFAULT_NOTE_FILTER', () => {
    it('starts flat, unsorted by anything but rank, and unfiltered by date', () => {
        expect(DEFAULT_NOTE_FILTER).toEqual({
            search: '',
            sort: 'manual',
            modified: 'any',
            group: 'none',
        })
    })
})

describe('isSearchActive', () => {
    it('ignores whitespace only search', () => {
        expect(isSearchActive(makeFilter({ search: '   ' }))).toBe(false)
        expect(isSearchActive(makeFilter({ search: 'a' }))).toBe(true)
    })
})

describe('isFilterActive', () => {
    it('is false for the default filter', () => {
        expect(isFilterActive(makeFilter())).toBe(false)
    })

    it('is false when only a search term is set', () => {
        expect(isFilterActive(makeFilter({ search: 'note' }))).toBe(false)
    })

    it('is true for a non default sort, date or group', () => {
        expect(isFilterActive(makeFilter({ sort: 'latest' }))).toBe(true)
        expect(isFilterActive(makeFilter({ modified: 'week' }))).toBe(true)
        expect(isFilterActive(makeFilter({ group: 'category' }))).toBe(true)
    })
})

describe('matchesSearch', () => {
    it('matches the term against name, desc and details', () => {
        expect(matchesSearch(makeNote({ name: 'Roadmap' }), 'road')).toBe(true)
        expect(matchesSearch(makeNote({ desc: 'weekly list' }), 'weekly')).toBe(true)
        expect(matchesSearch(makeNote({ details: 'ship it' }), 'SHIP'.toLowerCase())).toBe(true)
    })

    it('keeps everything for an empty term', () => {
        expect(matchesSearch(makeNote(), '')).toBe(true)
    })

    it('rejects a term that is nowhere to be found', () => {
        expect(matchesSearch(makeNote(), 'zzz')).toBe(false)
    })
})

describe('matchesModified', () => {
    const cases: Array<[NoteModified, string, boolean]> = [
        ['any', LONG_AGO, true],
        ['today', EARLY_TODAY, true],
        ['today', YESTERDAY, false],
        ['week', A_WEEK_AGO, true],
        ['week', A_DAY_BEFORE_THAT, false],
        ['month', A_MONTH_AGO, true],
        ['month', LONG_AGO, false],
    ]

    it.each(cases)('%s vs %s', (modified, updated, expected) => {
        expect(matchesModified(makeNote({ updated_at: updated }), modified, NOW)).toBe(expected)
    })

    it('rejects an unreadable date', () => {
        expect(matchesModified(makeNote({ updated_at: 'nope' }), 'today', NOW)).toBe(false)
    })
})

describe('compareByRank', () => {
    it('orders rank strings ascending', () => {
        const low = makeNote({ rank: '0|aaaaa:' })
        const high = makeNote({ rank: '0|zzzzz:' })
        expect(compareByRank(low, high)).toBe(-1)
        expect(compareByRank(high, low)).toBe(1)
        expect(compareByRank(low, low)).toBe(0)
    })
})

describe('sortNotes', () => {
    const notes = [
        makeNote({
            id: 'b',
            name: 'Beta',
            rank: '0|zzzzz:',
            updated_at: '2026-03-05T00:00:00.000Z',
        }),
        makeNote({
            id: 'a',
            name: 'Alpha',
            rank: '0|aaaaa:',
            updated_at: '2026-03-09T00:00:00.000Z',
        }),
    ]

    it('sorts manually by rank', () => {
        expect(sortNotes(notes, 'manual').map((n) => n.id)).toEqual(['a', 'b'])
    })

    it('sorts latest first', () => {
        expect(sortNotes(notes, 'latest').map((n) => n.id)).toEqual(['a', 'b'])
        expect(sortNotes(notes, 'oldest').map((n) => n.id)).toEqual(['b', 'a'])
    })

    it('sorts by name', () => {
        expect(sortNotes(notes, 'name-asc').map((n) => n.id)).toEqual(['a', 'b'])
        expect(sortNotes(notes, 'name-desc').map((n) => n.id)).toEqual(['b', 'a'])
    })

    it('does not mutate the input', () => {
        const input = [notes[0]!, notes[1]!]
        sortNotes(input, 'name-asc')
        expect(input.map((n) => n.id)).toEqual(['b', 'a'])
    })
})

describe('filterNotes', () => {
    const notes = [
        makeNote({
            id: 'a',
            name: 'Groceries',
            desc: 'weekly list',
            category_id: 'cat-work',
            updated_at: LONG_AGO,
        }),
        makeNote({
            id: 'b',
            name: 'Roadmap',
            desc: 'q1 goals',
            details: 'ship the filter',
            category_id: 'cat-home',
            updated_at: EARLY_TODAY,
        }),
    ]

    it('keeps everything with the default filter', () => {
        expect(filterNotes(notes, makeFilter(), NOW)).toHaveLength(2)
    })

    it('matches the search term across name, desc and details', () => {
        expect(filterNotes(notes, makeFilter({ search: 'road' }), NOW).map((n) => n.id)).toEqual([
            'b',
        ])
        expect(filterNotes(notes, makeFilter({ search: 'weekly' }), NOW).map((n) => n.id)).toEqual([
            'a',
        ])
        expect(filterNotes(notes, makeFilter({ search: 'SHIP' }), NOW).map((n) => n.id)).toEqual([
            'b',
        ])
    })

    it('narrows to the date window', () => {
        expect(filterNotes(notes, makeFilter({ modified: 'today' }), NOW).map((n) => n.id)).toEqual(
            ['b'],
        )
    })

    it('combines search with the date window', () => {
        const result = filterNotes(notes, makeFilter({ search: 'road', modified: 'today' }), NOW)
        expect(result.map((n) => n.id)).toEqual(['b'])
    })

    it('returns nothing when the filters exclude each other', () => {
        // Note b was updated today, so it drops out once today moves on.
        const tomorrow = new Date(NOW.getTime() + DAY_MS)
        expect(
            filterNotes(notes, makeFilter({ search: 'road', modified: 'today' }), tomorrow),
        ).toEqual([])
    })

    it('applies the sort to the result', () => {
        const result = filterNotes(notes, makeFilter({ sort: 'name-desc' }), NOW)
        expect(result.map((n) => n.id)).toEqual(['b', 'a'])
    })
})

describe('groupNotesByCategory', () => {
    const categories = [
        makeCategory({ id: 'cat-work', name: 'Work' }),
        makeCategory({ id: 'cat-home', name: 'Home' }),
    ]

    it('names each group after its category', () => {
        const groups = groupNotesByCategory(
            [makeNote({ id: 'a', category_id: 'cat-home' }), makeNote({ id: 'b' })],
            categories,
        )
        expect(groups.map((g) => g.name)).toEqual(['Home', 'Work'])
    })

    it('preserves the order it receives instead of re-sorting', () => {
        const groups = groupNotesByCategory(
            [
                makeNote({ id: 'late', rank: '0|zzzzz:' }),
                makeNote({ id: 'early', rank: '0|aaaaa:' }),
            ],
            categories,
        )
        expect(groups[0]?.notes.map((n) => n.id)).toEqual(['late', 'early'])
    })

    it('files notes with an unknown category as Uncategorized', () => {
        const groups = groupNotesByCategory([makeNote({ category_id: '' })], categories)
        expect(groups).toEqual([
            { id: UNCATEGORIZED_ID, name: 'Uncategorized', notes: [makeNote({ category_id: '' })] },
        ])
    })
})

describe('countNotesByCategory', () => {
    it('counts per category and buckets the uncategorized ones', () => {
        const counts = countNotesByCategory([
            makeNote({ id: 'a', category_id: 'cat-work' }),
            makeNote({ id: 'b', category_id: 'cat-work' }),
            makeNote({ id: 'c', category_id: '' }),
        ])
        expect(counts).toEqual({ 'cat-work': 2, [UNCATEGORIZED_ID]: 1 })
    })

    it('returns an empty map for no notes', () => {
        expect(countNotesByCategory([])).toEqual({})
    })
})
