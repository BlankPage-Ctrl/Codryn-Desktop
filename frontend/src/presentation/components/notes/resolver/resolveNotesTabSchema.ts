import type { NotesTabSchema } from '../types/schema'
import type { ResolvedNotesTab } from '../types/resolved'

export function resolveNotesTabSchema(schema: NotesTabSchema): ResolvedNotesTab {
    return {
        note: schema.note,
        categories: schema.categories,
        dirty: schema.dirty ?? false,
        saving: schema.saving ?? false,
        savedAt: schema.savedAt ?? null,
        autofocusName: schema.autofocusName ?? false,
        onNameCommit: schema.onNameCommit,
        onDescCommit: schema.onDescCommit,
        onDetailsCommit: schema.onDetailsCommit,
        onPriorityChange: schema.onPriorityChange,
        onCategoryChange: schema.onCategoryChange,
        onCreateCategory: schema.onCreateCategory,
        onSave: schema.onSave,
    }
}
