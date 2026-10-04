import type { DialogGridSchema } from '@/presentation/components/dialog/types'

export const categoryFormSchema: DialogGridSchema = {
    category: {
        columns: {
            name: {
                type: 'text-short',
                label: 'Name',
                placeholder: 'Category name',
                metadata: { require: true },
            },
        },
    },
}
