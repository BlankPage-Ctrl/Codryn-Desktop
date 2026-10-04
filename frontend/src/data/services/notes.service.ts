import {
    List as ListNotes,
    Get as GetNote,
    Create as CreateNote,
    Update as UpdateNote,
    Delete as DeleteNote,
    Move as MoveNote,
    Renumber as RenumberNotes,
} from '../../../wailsjs/go/notes/Service'
import {
    List as ListCategories,
    Create as CreateCategory,
    Delete as DeleteCategory,
    Rename as RenameCategory,
} from '../../../wailsjs/go/categories/Service'
import type {
    Note,
    NoteDto,
    NoteFilter,
    NoteListOpts,
    Category,
    CategoryDto,
} from '@/core/entities'
import type { NoteRepository, CategoryRepository } from '@/core/repositories'

export const notesRepository: NoteRepository = {
    list: (workspaceId: string, filter?: NoteFilter, opts?: NoteListOpts) => {
        const query = { ...filter, ...opts } as Record<string, string | number | undefined>
        const filterArg: Record<string, string | number> = {}
        for (const [k, v] of Object.entries(query)) {
            if (v !== undefined) filterArg[k] = v
        }
        return ListNotes(workspaceId, filterArg) as Promise<Note[]>
    },

    get: (workspaceId: string, id: string) => GetNote(workspaceId, id) as Promise<Note>,

    create: (workspaceId: string, dto: NoteDto) => CreateNote(workspaceId, dto) as Promise<Note>,

    update: (workspaceId: string, id: string, dto: Record<string, unknown>) =>
        UpdateNote(workspaceId, id, dto) as Promise<Note>,

    remove: (workspaceId: string, id: string) => DeleteNote(workspaceId, id) as Promise<void>,

    move: (workspaceId: string, id: string, position: { before?: string; after?: string }) =>
        MoveNote(workspaceId, id, position) as Promise<Note>,

    renumber: (workspaceId: string) => RenumberNotes(workspaceId) as Promise<{ ok: boolean }>,
}

export const categoriesRepository: CategoryRepository = {
    list: (workspaceId: string) => ListCategories(workspaceId) as Promise<Category[]>,
    create: (workspaceId: string, dto: CategoryDto) =>
        CreateCategory(workspaceId, dto) as Promise<Category>,
    rename: (workspaceId: string, id: string, name: string) =>
        RenameCategory(workspaceId, id, name) as Promise<Category>,
    remove: (workspaceId: string, id: string) => DeleteCategory(workspaceId, id) as Promise<void>,
}
