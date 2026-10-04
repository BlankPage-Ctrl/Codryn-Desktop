import type { DialogGridSchema } from '@/presentation/components/dialog/types'

export const chatFormSchema: DialogGridSchema = {
    chat: {
        columns: {
            title: {
                type: 'text-short',
                label: 'Title',
                placeholder: 'Chat title',
                metadata: { require: true },
            },
        },
    },
}
