import type { Note, Category } from '@/core/entities'
import type { NoteStorer } from '../stores/note.storer'

export interface NoteStoreLogic {
    beginLoad(): void
    endLoad(): void
    setError(message: string): void
    clearError(): void
    setNotes(list: Note[]): void
    setCategories(list: Category[]): void
    upsertNote(note: Note): void
    removeNote(id: string): void
    upsertCategory(category: Category): void
}

export function createNoteStoreLogic(getStorer: () => NoteStorer): NoteStoreLogic {
    function beginLoad(): void {
        const storer = getStorer()
        storer.setLoading(true)
        storer.clearError()
    }

    function endLoad(): void {
        getStorer().setLoading(false)
    }

    function setError(message: string): void {
        getStorer().setError(message)
    }

    function clearError(): void {
        getStorer().clearError()
    }

    function setNotes(list: Note[]): void {
        getStorer().setNotes(list)
    }

    function setCategories(list: Category[]): void {
        getStorer().setCategories(list)
    }

    function upsertNote(note: Note): void {
        getStorer().upsertNote(note)
    }

    function removeNote(id: string): void {
        getStorer().removeNote(id)
    }

    function upsertCategory(category: Category): void {
        getStorer().upsertCategory(category)
    }

    return {
        beginLoad,
        endLoad,
        setError,
        clearError,
        setNotes,
        setCategories,
        upsertNote,
        removeNote,
        upsertCategory,
    }
}
