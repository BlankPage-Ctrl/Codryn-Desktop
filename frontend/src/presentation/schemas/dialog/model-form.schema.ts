import type { DialogGridSchema } from '@/presentation/components/dialog/types'

export const modelFormSchema: DialogGridSchema = {
    row: {
        columns: {
            modelId: {
                type: 'text-short',
                label: 'Model ID',
                placeholder: 'e.g. gpt-4o',
                span: 6,
                metadata: { require: true },
            },
            displayName: {
                type: 'text-short',
                label: 'Display name',
                placeholder: 'e.g. GPT-4o',
                span: 6,
            },
            maxInputTokens: {
                type: 'number',
                label: 'Max input tokens (empty = unlimited)',
                placeholder: 'e.g. 128000',
                span: 6,
                metadata: { min: 1 },
            },
            maxOutputTokens: {
                type: 'number',
                label: 'Max output tokens (empty = provider default)',
                placeholder: 'e.g. 4096',
                span: 6,
                metadata: { min: 1 },
            },
        },
    },
}
