import type { NoteRepository, CategoryRepository } from '@/core/repositories'
import type { Note, NoteDto, NoteUpdateDto, Category, CategoryDto } from '@/core/entities'

export interface NoteBusinessLogic {
    list(workspaceId: string): Promise<Note[]>
    create(workspaceId: string, dto: NoteDto): Promise<Note>
    update(workspaceId: string, id: string, dto: NoteUpdateDto): Promise<Note>
    remove(workspaceId: string, id: string): Promise<void>
    move(
        workspaceId: string,
        id: string,
        position: { before?: string; after?: string },
    ): Promise<Note>
    renumber(workspaceId: string): Promise<{ ok: boolean }>
    listCategories(workspaceId: string): Promise<Category[]>
    createCategory(workspaceId: string, dto: CategoryDto): Promise<Category>
    renameCategory(workspaceId: string, id: string, name: string): Promise<Category>
    deleteCategory(workspaceId: string, id: string): Promise<void>
}

export function createNoteBusinessLogic(repo: {
    notes: NoteRepository
    categories: CategoryRepository
}): NoteBusinessLogic {
    return {
        list: (workspaceId) => repo.notes.list(workspaceId),
        create: (workspaceId, dto) => repo.notes.create(workspaceId, dto),
        update: (workspaceId, id, dto) =>
            repo.notes.update(workspaceId, id, dto as unknown as Record<string, unknown>),
        remove: (workspaceId, id) => repo.notes.remove(workspaceId, id),
        move: (workspaceId, id, position) => repo.notes.move(workspaceId, id, position),
        renumber: (workspaceId) => repo.notes.renumber(workspaceId),
        listCategories: (workspaceId) => repo.categories.list(workspaceId),
        createCategory: (workspaceId, dto) => repo.categories.create(workspaceId, dto),
        renameCategory: (workspaceId, id, name) => repo.categories.rename(workspaceId, id, name),
        deleteCategory: (workspaceId, id) => repo.categories.remove(workspaceId, id),
    }
}
