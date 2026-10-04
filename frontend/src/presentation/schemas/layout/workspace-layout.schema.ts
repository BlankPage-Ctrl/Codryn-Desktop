import type { ContainerSchema } from '@/presentation/components/container'

export interface WorkspaceLayoutParams {
    panelWidth: number
    collapsed: boolean
}

export function createWorkspaceLayout(params: WorkspaceLayoutParams): ContainerSchema[] {
    return [
        {
            id: 'workspace',
            columns: [
                {
                    id: 'panel',
                    width: params.panelWidth,
                    visible: !params.collapsed,
                    resizable: true,
                    resizeMode: 'edge',
                    minWidth: 180,
                    maxWidth: 480,
                    cell: {
                        background: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        borderWidth: '0 1px 0 0',
                        borderStyle: 'solid',
                        overflow: 'hidden',
                    },
                },
                {
                    id: 'content',
                    width: '1fr',
                    resizable: false,
                    cell: {
                        background: 'var(--bg-primary)',
                        overflow: 'hidden',
                    },
                },
            ],
        },
    ]
}
