import type {
    Note,
    NoteDto,
    NoteFilter,
    NoteListOpts,
    Category,
    CategoryDto,
} from '../entities/note'

export interface NoteRepository {
    list(workspaceId: string, filter?: NoteFilter, opts?: NoteListOpts): Promise<Note[]>
    get(workspaceId: string, id: string): Promise<Note>
    create(workspaceId: string, dto: NoteDto): Promise<Note>
    update(workspaceId: string, id: string, dto: Record<string, unknown>): Promise<Note>
    remove(workspaceId: string, id: string): Promise<void>
    move(
        workspaceId: string,
        id: string,
        position: { before?: string; after?: string },
    ): Promise<Note>
    renumber(workspaceId: string): Promise<{ ok: boolean }>
}

export interface CategoryRepository {
    list(workspaceId: string): Promise<Category[]>
    create(workspaceId: string, dto: CategoryDto): Promise<Category>
    rename(workspaceId: string, id: string, name: string): Promise<Category>
    remove(workspaceId: string, id: string): Promise<void>
}
