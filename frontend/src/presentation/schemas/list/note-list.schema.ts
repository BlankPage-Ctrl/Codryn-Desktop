import type { Note } from '@/core/entities'
import type { ListSchema } from '@/presentation/components/list'
import { EditActionIcon, TrashActionIcon } from '@/presentation/schemas/common/icons.schema'

export interface SidebarNoteListHandlers {
    activeNoteId?: string
    onSelect?: (note: Note) => void
    onEdit?: (note: Note) => void
    onDelete?: (note: Note) => void
    onCreate?: () => void
}

export function createSidebarNoteListSchema(handlers: SidebarNoteListHandlers): ListSchema<Note> {
    const actions: NonNullable<ListSchema<Note>['actions']> = []
    if (handlers.onEdit) {
        actions.push({
            icon: EditActionIcon,
            ariaLabel: 'Edit',
            variant: 'ghost',
            size: 'xs',
            onClick: handlers.onEdit,
        })
    }
    if (handlers.onDelete) {
        actions.push({
            icon: TrashActionIcon,
            ariaLabel: 'Delete',
            variant: 'danger',
            size: 'xs',
            onClick: handlers.onDelete,
        })
    }

    return {
        variant: 'sidebar',
        size: 'md',
        textSize: 'sm',
        activeKey: 'id',
        activeId: handlers.activeNoteId,
        dim: true,
        fields: [
            { key: 'name', class: 'title' },
            { key: 'desc', class: 'subtitle', visible: (n) => !!n.desc },
            { key: 'priority', class: 'meta', format: formatPriority },
        ],
        actions,
        emptyMessage: 'No notes yet',
        emptyAction: handlers.onCreate
            ? { label: 'Create your first note', onClick: handlers.onCreate }
            : undefined,
        onSelect: handlers.onSelect,
    }
}

export function formatPriority(value: unknown): string {
    const p = String(value ?? '').toUpperCase()
    return p ? `• ${p}` : ''
}
