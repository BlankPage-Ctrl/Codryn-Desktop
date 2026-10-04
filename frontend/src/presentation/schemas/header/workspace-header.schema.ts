import { ChatBubble, Plus, Settings } from '@iconoir/vue'
import type { HeaderAction, HeaderSchema } from '@/presentation/components/header'

export interface WorkspacesHeaderHandlers {
    onSettings: () => void
    onCreate: () => void
}

export function createWorkspacesHeaderSchema(handlers: WorkspacesHeaderHandlers): HeaderSchema {
    const actions: HeaderAction[] = [
        { icon: Settings, ariaLabel: 'Settings', onClick: handlers.onSettings },
        { icon: Plus, ariaLabel: 'New workspace', onClick: handlers.onCreate },
    ]

    return {
        title: 'Workspaces',
        height: 'sm',
        padding: 'md',
        actions,
    }
}

export interface ChatHeaderHandlers {
    title: string
    subtitle?: string
    onOpen: () => void
}

export function createChatHeaderSchema(handlers: ChatHeaderHandlers): HeaderSchema {
    return {
        title: handlers.title,
        subtitle: handlers.subtitle,
        height: 'md',
        padding: 'md',
        border: true,
        actions: [{ icon: ChatBubble, ariaLabel: 'Open', label: 'Open', onClick: handlers.onOpen }],
    }
}
