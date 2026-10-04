import type { Workspace } from '@/core/entities'
import type { ListSchema, ListItemAction } from '@/presentation/components/list'
import { EditActionIcon, TrashActionIcon } from '@/presentation/schemas/common/icons.schema'

export interface WorkspaceListHandlers {
    activeWorkspaceId?: string | null
    onSelect: (workspace: Workspace) => void
    onEdit: (workspace: Workspace) => void
    onDelete: (workspace: Workspace) => void
    onCreate: () => void
}

export function createWorkspaceListSchema(handlers: WorkspaceListHandlers): ListSchema<Workspace> {
    const actions: ListItemAction<Workspace>[] = [
        {
            icon: EditActionIcon,
            ariaLabel: 'Edit',
            variant: 'ghost',
            size: 'xs',
            onClick: handlers.onEdit,
        },
        {
            icon: TrashActionIcon,
            ariaLabel: 'Delete',
            variant: 'danger',
            size: 'xs',
            onClick: handlers.onDelete,
        },
    ]

    return {
        variant: 'sidebar',
        size: 'sm',
        activeKey: 'id',
        activeId: handlers.activeWorkspaceId,
        fields: [
            { key: 'name', class: 'title' },
            { key: 'description', class: 'subtitle', visible: (ws) => !!ws.description },
            { key: 'projectPath', class: 'meta' },
        ],
        actions,
        emptyMessage: 'No workspaces yet',
        emptyAction: { label: 'Create your first workspace', onClick: handlers.onCreate },
        onSelect: handlers.onSelect,
    }
}
