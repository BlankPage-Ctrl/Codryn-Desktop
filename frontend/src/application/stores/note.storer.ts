import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Note, Category } from '@/core/entities'

export const useNoteStorer = defineStore('note', () => {
    const notes = ref<Note[]>([])
    const categories = ref<Category[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    function setNotes(list: Note[]): void {
        notes.value = list
    }

    function setCategories(list: Category[]): void {
        categories.value = list
    }

    function setLoading(v: boolean): void {
        loading.value = v
    }

    function setError(message: string | null): void {
        error.value = message
    }

    function clearError(): void {
        error.value = null
    }

    function upsertNote(note: Note): void {
        const idx = notes.value.findIndex((n) => n.id === note.id)
        if (idx === -1) {
            notes.value.unshift(note)
        } else {
            notes.value[idx] = { ...notes.value[idx], ...note }
        }
    }

    function removeNote(id: string): void {
        notes.value = notes.value.filter((n) => n.id !== id)
    }

    function upsertCategory(category: Category): void {
        const idx = categories.value.findIndex((c) => c.id === category.id)
        if (idx === -1) {
            categories.value.push(category)
        } else {
            categories.value[idx] = { ...categories.value[idx], ...category }
        }
    }

    return {
        notes,
        categories,
        loading,
        error,
        setNotes,
        setCategories,
        setLoading,
        setError,
        clearError,
        upsertNote,
        removeNote,
        upsertCategory,
    }
})

export type NoteStorer = ReturnType<typeof useNoteStorer>
