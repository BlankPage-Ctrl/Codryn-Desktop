import type { Category } from '@/core/entities'
import type { CategoriesTabSchema } from '@/presentation/components/notes/types/schema'

export interface CategoriesTabParams {
    categories: Category[]
    counts: Record<string, number>
    error?: string | null
    onCreate: () => void
    onRename: (category: Category) => void
    onDelete: (category: Category) => void
}

export function createCategoriesTabSchema(params: CategoriesTabParams): CategoriesTabSchema {
    return {
        categories: params.categories,
        counts: params.counts,
        error: params.error,
        onCreate: params.onCreate,
        onRename: params.onRename,
        onDelete: params.onDelete,
    }
}
