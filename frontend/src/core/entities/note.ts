export type Priority = 'low' | 'medium' | 'high' | 'critical'

export interface Note {
    id: string
    name: string
    category_id: string
    desc: string
    details: string
    rank: string
    priority: Priority
    created_at: string
    updated_at: string
    version: number
}

export interface NoteDto {
    name: string
    category_id?: string
    desc?: string
    details?: string
    priority?: Priority
    position?: { before?: string; after?: string }
}

export interface NoteUpdateDto {
    name?: string
    category_id?: string | null
    desc?: string
    details?: string
    priority?: Priority
    version?: number
}

export interface NoteFilter {
    category?: string
    priority?: string
    search?: string
}

export interface NoteListOpts {
    sort?: 'rank' | 'priority' | 'updated_at' | 'created_at' | 'name'
    order?: 'asc' | 'desc'
    limit?: number
    offset?: number
}

export interface Category {
    id: string
    name: string
    color: string | null
    is_default: boolean
    created_at: string
}

export interface CategoryDto {
    name: string
    color?: string
}
