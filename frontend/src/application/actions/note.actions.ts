import type { NoteStoreLogic } from '../store-logic/note.logic'
import type { NoteBusinessLogic } from '../business-logic/note.logic'
import type { Note, NoteDto, NoteUpdateDto, CategoryDto } from '@/core/entities'
import { toMessage } from '@/shared/utils/error.utils'

export interface NoteActions {
    fetchNotes(workspaceId: string): Promise<void>
    createNote(workspaceId: string, dto: NoteDto): Promise<string>
    updateNote(workspaceId: string, id: string, dto: NoteUpdateDto): Promise<void>
    deleteNote(workspaceId: string, id: string): Promise<void>
    moveNote(
        workspaceId: string,
        id: string,
        position: { before?: string; after?: string },
    ): Promise<void>
    renumberNotes(workspaceId: string): Promise<void>
    fetchCategories(workspaceId: string): Promise<void>
    createCategory(workspaceId: string, dto: CategoryDto): Promise<string>
    renameCategory(workspaceId: string, id: string, name: string): Promise<void>
    deleteCategory(workspaceId: string, id: string): Promise<void>
    upsertLocalNote(note: Note): void
    removeLocalNote(id: string): void
}

export function createNoteActions(
    storeLogic: NoteStoreLogic,
    businessLogic: NoteBusinessLogic,
): NoteActions {
    async function fetchNotes(workspaceId: string): Promise<void> {
        storeLogic.beginLoad()
        try {
            storeLogic.setNotes(await businessLogic.list(workspaceId))
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to load notes')
        } finally {
            storeLogic.endLoad()
        }
    }

    async function createNote(workspaceId: string, dto: NoteDto): Promise<string> {
        storeLogic.clearError()
        try {
            const note = await businessLogic.create(workspaceId, dto)
            storeLogic.upsertNote(note)
            return note.id
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to create note')
            throw e
        }
    }

    async function updateNote(workspaceId: string, id: string, dto: NoteUpdateDto): Promise<void> {
        storeLogic.clearError()
        try {
            storeLogic.upsertNote(await businessLogic.update(workspaceId, id, dto))
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to update note')
            throw e
        }
    }

    async function deleteNote(workspaceId: string, id: string): Promise<void> {
        storeLogic.clearError()
        try {
            await businessLogic.remove(workspaceId, id)
            storeLogic.removeNote(id)
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to delete note')
            throw e
        }
    }

    async function moveNote(
        workspaceId: string,
        id: string,
        position: { before?: string; after?: string },
    ): Promise<void> {
        storeLogic.clearError()
        try {
            storeLogic.upsertNote(await businessLogic.move(workspaceId, id, position))
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to move note')
            throw e
        }
    }

    async function renumberNotes(workspaceId: string): Promise<void> {
        storeLogic.clearError()
        try {
            await businessLogic.renumber(workspaceId)
            await fetchNotes(workspaceId)
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to renumber notes')
            throw e
        }
    }

    async function fetchCategories(workspaceId: string): Promise<void> {
        try {
            storeLogic.setCategories(await businessLogic.listCategories(workspaceId))
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to load categories')
        }
    }

    async function createCategory(workspaceId: string, dto: CategoryDto): Promise<string> {
        storeLogic.clearError()
        try {
            const category = await businessLogic.createCategory(workspaceId, dto)
            storeLogic.upsertCategory(category)
            return category.id
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to create category')
            throw e
        }
    }

    async function renameCategory(workspaceId: string, id: string, name: string): Promise<void> {
        storeLogic.clearError()
        try {
            storeLogic.upsertCategory(await businessLogic.renameCategory(workspaceId, id, name))
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to rename category')
            throw e
        }
    }

    async function deleteCategory(workspaceId: string, id: string): Promise<void> {
        storeLogic.clearError()
        try {
            await businessLogic.deleteCategory(workspaceId, id)
            // categories are re-fetched or removed via store; for now just refetch
            await fetchCategories(workspaceId)
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to delete category')
            throw e
        }
    }

    function upsertLocalNote(note: Note): void {
        storeLogic.upsertNote(note)
    }

    function removeLocalNote(id: string): void {
        storeLogic.removeNote(id)
    }

    return {
        fetchNotes,
        createNote,
        updateNote,
        deleteNote,
        moveNote,
        renumberNotes,
        fetchCategories,
        createCategory,
        renameCategory,
        deleteCategory,
        upsertLocalNote,
        removeLocalNote,
    }
}
