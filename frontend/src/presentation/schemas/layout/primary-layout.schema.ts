import type { ContainerSchema } from '@/presentation/components/container'

export const primaryLayout: ContainerSchema[] = [
    {
        id: 'row-1',
        height: '1fr',
        columns: [
            {
                id: 'cell-1-1',
                width: 200,
                resizable: true,
                minWidth: 150,
                maxWidth: 400,
                cell: {
                    padding: 0,
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    radius: 0,
                },
            },
            {
                id: 'cell-1-2',
                width: '1fr',
                cell: {
                    padding: 0,
                    background: 'var(--bg-primary)',
                    borderColor: 'var(--border-color)',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    radius: 0,
                },
            },
        ],
    },
]
