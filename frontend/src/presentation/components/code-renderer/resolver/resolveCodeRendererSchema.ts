import type { CodeRendererSchema, ResolvedCodeRendererSchema } from '../types/schema'

export const DEFAULT_LIGHT_THEME = 'github-light'
export const DEFAULT_DARK_THEME = 'github-dark'

export interface ResolveCodeRendererDefaults {
    isDark?: boolean
    fontSize?: number
    lineHeight?: number
    theme?: {
        light?: string
        dark?: string
    }
}

export function resolveCodeRendererSchema(
    schema: CodeRendererSchema,
    defaults: ResolveCodeRendererDefaults = {},
): ResolvedCodeRendererSchema {
    return {
        code: schema.code,
        lang: schema.lang ?? 'plaintext',
        variant: schema.variant ?? 'code',
        status: schema.status ?? (schema.code ? 'done' : 'idle'),
        isDark: schema.isDark ?? defaults.isDark ?? false,
        theme: {
            light: schema.theme?.light ?? defaults.theme?.light ?? DEFAULT_LIGHT_THEME,
            dark: schema.theme?.dark ?? defaults.theme?.dark ?? DEFAULT_DARK_THEME,
        },
        fontSize: schema.fontSize ?? defaults.fontSize ?? 13,
        lineHeight: schema.lineHeight ?? defaults.lineHeight ?? 1.55,
    }
}
