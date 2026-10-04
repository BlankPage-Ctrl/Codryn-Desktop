import { Folder, Trash } from '@iconoir/vue'
import type { DropdownItemConfig, DropdownProps } from '@/presentation/components/dropdown/types'
import { WORKSPACE_COMMANDS } from '@/presentation/schemas/common/commands'
import type { Workspace } from '@/core/entities'

export interface WorkspaceDropdownParams {
    workspaces: Workspace[]
    selectedWorkspaceId: string | null
}

export function createWorkspaceDropdownItems(
    params: WorkspaceDropdownParams,
): DropdownItemConfig[] {
    return params.workspaces.map((ws) => ({
        id: ws.id,
        label: ws.name,
        icon: Folder,
        value: ws.id,
        selected: ws.id === params.selectedWorkspaceId,
        rightIcon: Trash,
        rightAction: {
            type: 'command',
            command: WORKSPACE_COMMANDS.DELETE,
            args: { id: ws.id },
        },
    }))
}

export const workspaceDropdownProps: Pick<
    DropdownProps,
    'mode' | 'placement' | 'width' | 'offset' | 'dense' | 'style'
> = {
    mode: 'menu',
    placement: 'bottom',
    width: { mode: 'fixed', width: 166 },
    offset: 6,
    dense: true,
    style: {
        menu: {
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '2px',
        },
        item: {
            borderRadius: '4px',
            hoverBackground: 'rgba(var(--raw-border-color), 0.3)',
            selectedBackground: 'rgba(var(--raw-border-color), 0.3)',
        },
    },
}
