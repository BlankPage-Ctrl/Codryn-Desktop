import type { Chat } from '@/core/entities'
import type { ListSchema, ListItemAction } from '@/presentation/components/list'
import { EditActionIcon, TrashActionIcon } from '@/presentation/schemas/common/icons.schema'

export interface SidebarChatListHandlers {
    activeChatId?: string
    onSelect?: (chat: Chat) => void
    onEdit?: (chat: Chat) => void
    onDelete?: (chat: Chat) => void
    onCreate?: () => void
}

export function createSidebarChatListSchema(handlers: SidebarChatListHandlers): ListSchema<Chat> {
    const actions: ListItemAction<Chat>[] = []
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
        size: 'sm',
        activeKey: 'id',
        activeId: handlers.activeChatId,
        dim: true,
        fields: [{ key: 'title', class: 'title' }],
        actions,
        emptyMessage: 'No chats yet',
        emptyAction: handlers.onCreate
            ? { label: 'Create your first chat', onClick: handlers.onCreate }
            : undefined,
        onSelect: handlers.onSelect,
    }
}

function fmtDate(iso: unknown): string {
    return new Date(String(iso)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const chatListContentSchema: ListSchema<Chat> = {
    variant: 'content',
    size: 'md',
    fields: [
        { key: 'title', class: 'title' },
        { key: 'createdAt', class: 'date', format: fmtDate },
    ],
    emptyMessage: 'No chats yet',
}
