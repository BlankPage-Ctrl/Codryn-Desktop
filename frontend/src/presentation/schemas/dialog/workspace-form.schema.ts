import type { DialogGridSchema } from '@/presentation/components/dialog/types'

export const workspaceFormSchema: DialogGridSchema = {
    ws: {
        columns: {
            name: {
                type: 'text-short',
                label: 'Name',
                placeholder: 'My workspace',
                metadata: { require: true },
            },
            description: {
                type: 'text-short',
                label: 'Description',
                placeholder: 'Optional description',
            },
            projectPath: {
                type: 'folder',
                label: 'Project path',
                placeholder: 'No folder selected',
                metadata: { require: true },
            },
        },
    },
}
