import type { Note, Category } from '@/core/entities'
import type { NoteGroupItem } from '../types/schema'

export type NoteSort = 'manual' | 'latest' | 'oldest' | 'name-asc' | 'name-desc'

export type NoteModified = 'any' | 'today' | 'week' | 'month'

export type NoteGroupBy = 'none' | 'category'

export interface NoteFilterState {
    search: string
    sort: NoteSort
    modified: NoteModified
    group: NoteGroupBy
}

export const DEFAULT_NOTE_FILTER: NoteFilterState = {
    search: '',
    sort: 'manual',
    modified: 'any',
    group: 'none',
}

/** Notes whose category_id does not match any known category land here. */
export const UNCATEGORIZED_ID = '__uncategorized__'

const DAY_MS = 24 * 60 * 60 * 1000

export function isSearchActive(filter: NoteFilterState): boolean {
    return filter.search.trim().length > 0
}

export function isFilterActive(filter: NoteFilterState): boolean {
    return (
        filter.sort !== DEFAULT_NOTE_FILTER.sort ||
        filter.modified !== DEFAULT_NOTE_FILTER.modified ||
        filter.group !== DEFAULT_NOTE_FILTER.group
    )
}

export function matchesSearch(note: Note, term: string): boolean {
    if (!term) return true
    return (
        note.name.toLowerCase().includes(term) ||
        note.desc.toLowerCase().includes(term) ||
        note.details.toLowerCase().includes(term)
    )
}

function startOfDay(now: Date): number {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    return start.getTime()
}

export function matchesModified(note: Note, modified: NoteModified, now: Date): boolean {
    if (modified === 'any') return true
    const updated = new Date(note.updated_at).getTime()
    if (Number.isNaN(updated)) return false
    if (modified === 'today') return updated >= startOfDay(now)
    if (modified === 'week') return updated >= now.getTime() - 7 * DAY_MS
    return updated >= now.getTime() - 30 * DAY_MS
}

/**
 * Ranks are LexoRank strings ordered lexicographically, which matches the
 * backend rank ASC sort. The store prepends locally created notes, so the
 * incoming array order is not reliable on its own.
 */
export function compareByRank(a: Note, b: Note): number {
    return a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0
}

export function sortNotes(notes: Note[], sort: NoteSort): Note[] {
    const sorted = [...notes]
    switch (sort) {
        case 'latest':
            return sorted.sort((a, b) => updatedTime(b) - updatedTime(a) || compareByRank(a, b))
        case 'oldest':
            return sorted.sort((a, b) => updatedTime(a) - updatedTime(b) || compareByRank(a, b))
        case 'name-asc':
            return sorted.sort((a, b) => a.name.localeCompare(b.name) || compareByRank(a, b))
        case 'name-desc':
            return sorted.sort((a, b) => b.name.localeCompare(a.name) || compareByRank(a, b))
        default:
            return sorted.sort(compareByRank)
    }
}

function updatedTime(note: Note): number {
    const value = new Date(note.updated_at).getTime()
    return Number.isNaN(value) ? 0 : value
}

export function filterNotes(
    notes: Note[],
    filter: NoteFilterState,
    now: Date = new Date(),
): Note[] {
    const term = filter.search.trim().toLowerCase()
    const matched = notes.filter(
        (note) => matchesSearch(note, term) && matchesModified(note, filter.modified, now),
    )
    return sortNotes(matched, filter.sort)
}

/** Buckets notes by category while preserving the order they arrive in. */
export function groupNotesByCategory(notes: Note[], categories: Category[]): NoteGroupItem[] {
    const map = new Map<string, Note[]>()
    for (const note of notes) {
        const key = note.category_id || UNCATEGORIZED_ID
        const bucket = map.get(key)
        if (bucket) bucket.push(note)
        else map.set(key, [note])
    }
    return [...map.entries()].map(([categoryId, groupNotes]) => ({
        id: categoryId,
        name: categories.find((c) => c.id === categoryId)?.name ?? 'Uncategorized',
        notes: groupNotes,
    }))
}

export function countNotesByCategory(notes: Note[]): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const note of notes) {
        const key = note.category_id || UNCATEGORIZED_ID
        counts[key] = (counts[key] ?? 0) + 1
    }
    return counts
}
