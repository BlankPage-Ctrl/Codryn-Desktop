import type { CategoriesTabSchema } from '../types/schema'
import type { ResolvedCategoriesTab } from '../types/resolved'

export function resolveCategoriesTabSchema(schema: CategoriesTabSchema): ResolvedCategoriesTab {
    return {
        rows: schema.categories.map((category) => ({
            category,
            noteCount: schema.counts[category.id] ?? 0,
        })),
        total: schema.categories.length,
        error: schema.error ?? null,
        onCreate: schema.onCreate,
        onRename: schema.onRename,
        onDelete: schema.onDelete,
    }
}
