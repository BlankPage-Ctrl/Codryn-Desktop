import { ChatBubbleEmpty, Folder, Notes } from '@iconoir/vue'
import type { IconRailsSchema } from '@/presentation/components/icon-rails'

export interface ChatRailsParams {
    showFiles: boolean
    showNotes?: boolean
    onChat: () => void
    onFiles: () => void
    onNotes?: () => void
}

export function createChatRailsSchema(params: ChatRailsParams): IconRailsSchema {
    const items: IconRailsSchema['items'] = [
        {
            id: 'chat',
            icon: ChatBubbleEmpty,
            ariaLabel: 'Chat',
            tooltip: 'Chat',
            active: !params.showFiles && !params.showNotes,
            onClick: params.onChat,
        },
        {
            id: 'files',
            icon: Folder,
            ariaLabel: 'File Explorer',
            tooltip: 'File Explorer',
            active: params.showFiles,
            onClick: params.onFiles,
        },
    ]

    if (params.onNotes) {
        items.push({
            id: 'notes',
            icon: Notes,
            ariaLabel: 'Notes',
            tooltip: 'Notes',
            active: !!params.showNotes,
            onClick: params.onNotes,
        })
    }

    return { items }
}
