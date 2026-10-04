import type { DialogGridSchema, OptionItem } from '@/presentation/components/dialog/types'
import type { ProviderTypeInfo } from '@/core/entities'

export const BUILTIN_PROVIDER_TYPE_OPTIONS: OptionItem[] = [
    { label: 'OpenAI', value: 'openai' },
    { label: 'OpenAI Compatible', value: 'openai-compatible' },
    { label: 'OpenRouter', value: 'openrouter' },
]

export function providerTypeOptions(types: ProviderTypeInfo[]): OptionItem[] {
    if (!types.length) return BUILTIN_PROVIDER_TYPE_OPTIONS
    return types.map((t) => ({ label: t.label, value: t.id }))
}

export function requiresProviderBaseURL(types: ProviderTypeInfo[], typeValue: unknown): boolean {
    const id = String(typeValue ?? '')
    const found = types.find((t) => t.id === id)
    if (found) return found.requiresBaseURL
    return id === 'openai-compatible'
}

export function createProviderFormSchema(types: ProviderTypeInfo[]): DialogGridSchema {
    return {
        row: {
            columns: {
                name: {
                    type: 'text-short',
                    label: 'Name',
                    placeholder: 'e.g. OpenAI',
                    span: 6,
                    metadata: { require: true },
                },
                type: {
                    type: 'select',
                    label: 'Type',
                    span: 6,
                    metadata: {
                        require: true,
                        options: providerTypeOptions(types),
                    },
                },
                apiKey: { type: 'text-short', label: 'API key', placeholder: 'sk-...', span: 12 },
                baseURL: {
                    type: 'text-short',
                    label: 'Base URL',
                    placeholder: 'https://api.example.com/v1',
                    span: 12,
                    reveal: {
                        label: 'Custom base URL',
                        match: (values) => requiresProviderBaseURL(types, values.type),
                    },
                },
            },
        },
    }
}

// Static fallback (builtin types) for callers that render before types load.
export const providerFormSchema: DialogGridSchema = createProviderFormSchema([])
