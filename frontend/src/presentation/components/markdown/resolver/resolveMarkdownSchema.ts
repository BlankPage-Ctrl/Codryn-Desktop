import type { MarkdownSchema, ResolvedMarkdownSchema } from '../types'
import { defaultRendererRegistry } from '../components/nodes'

export interface ResolveMarkdownDefaults {
    isDark?: boolean
    fontSize?: number
    lineHeight?: number
    code?: {
        theme?: {
            light?: string
            dark?: string
        }
    }
}

export function resolveMarkdownSchema(
    schema: MarkdownSchema,
    defaults: ResolveMarkdownDefaults = {},
): ResolvedMarkdownSchema {
    return {
        text: schema.text,
        mode: schema.state === 'streaming' ? 'streaming' : 'static',
        isDark: schema.isDark ?? defaults.isDark ?? false,
        fontSize: schema.fontSize ?? defaults.fontSize ?? 14,
        lineHeight: schema.lineHeight ?? defaults.lineHeight ?? 1.7,
        code: {
            theme: {
                light: schema.code?.theme?.light ?? defaults.code?.theme?.light,
                dark: schema.code?.theme?.dark ?? defaults.code?.theme?.dark,
            },
        },
        renderers: {
            ...defaultRendererRegistry,
            ...schema.renderers,
        },
    }
}
