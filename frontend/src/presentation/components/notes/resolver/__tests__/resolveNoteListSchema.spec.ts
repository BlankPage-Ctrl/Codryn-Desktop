import { describe, it, expect } from 'vitest'
import { resolveNoteListSchema, type NoteListHandlers } from '../resolveNoteListSchema'
import { DEFAULT_NOTE_FILTER } from '../filterNotes'
import type { NoteListSchema } from '../../types/schema'
import type { Note, Category } from '@/core/entities'

function makeNote(overrides: Partial<Note> = {}): Note {
    return {
        id: 'note-1',
        name: 'Groceries',
        category_id: 'cat-work',
        desc: '',
        details: '',
        rank: '0|aaaaa:',
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

function makeSchema(overrides: Partial<NoteListSchema> = {}): NoteListSchema {
    return {
        notes: [],
        categories: [],
        filter: { ...DEFAULT_NOTE_FILTER },
        searchOpen: false,
        categoriesOpen: false,
        ...overrides,
    }
}

function makeHandlers(): NoteListHandlers {
    return { onSearch: () => {}, onCloseSearch: () => {}, onFilterSelect: () => {} }
}

describe('resolveNoteListSchema rows', () => {
    it('renders only note rows by default', () => {
        const resolved = resolveNoteListSchema(
            makeSchema({
                notes: [
                    makeNote({ id: 'a', rank: '0|aaaaa:' }),
                    makeNote({ id: 'b', rank: '0|bbbbb:' }),
                ],
            }),
            makeHandlers(),
        )
        expect(resolved.rows.map((r) => r.kind)).toEqual(['note', 'note'])
    })

    it('inserts a heading before each group when grouping is on', () => {
        const resolved = resolveNoteListSchema(
            makeSchema({
                notes: [
                    makeNote({ id: 'a', category_id: 'cat-work', rank: '0|aaaaa:' }),
                    makeNote({ id: 'b', category_id: 'cat-home', rank: '0|bbbbb:' }),
                ],
                categories: [
                    makeCategory({ id: 'cat-work', name: 'Work' }),
                    makeCategory({ id: 'cat-home', name: 'Home' }),
                ],
                filter: { ...DEFAULT_NOTE_FILTER, group: 'category' },
            }),
            makeHandlers(),
        )
        expect(resolved.rows.map((r) => r.kind)).toEqual(['heading', 'note', 'heading', 'note'])
    })

    it('names the heading after the category and counts its notes', () => {
        const resolved = resolveNoteListSchema(
            makeSchema({
                notes: [
                    makeNote({ id: 'a', category_id: 'cat-work' }),
                    makeNote({ id: 'b', category_id: 'cat-work' }),
                ],
                categories: [makeCategory({ id: 'cat-work', name: 'Work' })],
                filter: { ...DEFAULT_NOTE_FILTER, group: 'category' },
            }),
            makeHandlers(),
        )
        const heading = resolved.rows[0]
        expect(heading?.kind).toBe('heading')
        expect(heading).toMatchObject({ label: 'Work', count: 2 })
    })

    it('gives every row a unique key', () => {
        const resolved = resolveNoteListSchema(
            makeSchema({
                notes: [
                    makeNote({ id: 'a', category_id: 'cat-work' }),
                    makeNote({ id: 'b', category_id: 'cat-home' }),
                ],
                categories: [makeCategory({ id: 'cat-work' }), makeCategory({ id: 'cat-home' })],
                filter: { ...DEFAULT_NOTE_FILTER, group: 'category' },
            }),
            makeHandlers(),
        )
        expect(new Set(resolved.rows.map((r) => r.key)).size).toBe(resolved.rows.length)
    })

    it('flags the active note', () => {
        const resolved = resolveNoteListSchema(
            makeSchema({ notes: [makeNote({ id: 'a' })], activeNoteId: 'a' }),
            makeHandlers(),
        )
        expect(resolved.rows[0]).toMatchObject({ kind: 'note', active: true })
    })
})

describe('resolveNoteListSchema header', () => {
    it('counts notes when nothing is filtered', () => {
        const resolved = resolveNoteListSchema(
            makeSchema({ notes: [makeNote({ id: 'a' }), makeNote({ id: 'b' })] }),
            makeHandlers(),
        )
        expect(resolved.countLabel).toBe('2 notes')
    })

    it('uses the singular form for one note', () => {
        const resolved = resolveNoteListSchema(makeSchema({ notes: [makeNote()] }), makeHandlers())
        expect(resolved.countLabel).toBe('1 note')
    })

    it('shows how many matched once a filter is on', () => {
        const resolved = resolveNoteListSchema(
            makeSchema({
                notes: [
                    makeNote({ id: 'a', name: 'Groceries' }),
                    makeNote({ id: 'b', name: 'Roadmap' }),
                ],
                filter: { ...DEFAULT_NOTE_FILTER, search: 'road' },
            }),
            makeHandlers(),
        )
        expect(resolved.countLabel).toBe('1 of 2')
    })

    it('marks the search active on a non blank term', () => {
        const resolved = resolveNoteListSchema(
            makeSchema({ filter: { ...DEFAULT_NOTE_FILTER, search: 'road' } }),
            makeHandlers(),
        )
        expect(resolved.searchActive).toBe(true)
    })

    it('marks the filter active once an option leaves the default', () => {
        const resolved = resolveNoteListSchema(
            makeSchema({ filter: { ...DEFAULT_NOTE_FILTER, sort: 'latest' } }),
            makeHandlers(),
        )
        expect(resolved.filter.active).toBe(true)
    })

    it('passes the current filter state to the menu', () => {
        const resolved = resolveNoteListSchema(
            makeSchema({ filter: { ...DEFAULT_NOTE_FILTER, group: 'category' } }),
            makeHandlers(),
        )
        expect(resolved.filter.state.group).toBe('category')
        expect(resolved.filter.active).toBe(true)
    })
})

describe('resolveNoteListSchema empty message', () => {
    it('says so when the workspace has no notes at all', () => {
        const resolved = resolveNoteListSchema(makeSchema(), makeHandlers())
        expect(resolved.emptyMessage).toBe('No notes yet')
    })

    it('blames the filters when notes exist but none match', () => {
        const resolved = resolveNoteListSchema(
            makeSchema({
                notes: [makeNote({ name: 'Groceries' })],
                filter: { ...DEFAULT_NOTE_FILTER, search: 'zzz' },
            }),
            makeHandlers(),
        )
        expect(resolved.emptyMessage).toBe('No notes match your filters')
    })
})

describe('resolveNoteListSchema handlers', () => {
    it('passes the handlers straight through', () => {
        const handlers = makeHandlers()
        const resolved = resolveNoteListSchema(makeSchema(), handlers)
        expect(resolved.onSearch).toBe(handlers.onSearch)
        expect(resolved.onCloseSearch).toBe(handlers.onCloseSearch)
        expect(resolved.onFilterSelect).toBe(handlers.onFilterSelect)
    })
})
