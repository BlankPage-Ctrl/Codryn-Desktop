import { inject, provide, type ComputedRef, type InjectionKey } from 'vue'
import type { RendererRegistry } from '../types'

export interface MarkdownRenderContext {
    isDark: ComputedRef<boolean>
    fontSize: ComputedRef<number>
    lineHeight: ComputedRef<number>
    codeTheme: ComputedRef<{ light?: string; dark?: string }>
    registry: ComputedRef<RendererRegistry>
}

const MARKDOWN_CONTEXT_KEY: InjectionKey<MarkdownRenderContext> = Symbol('markdown-render-context')

export function provideMarkdownContext(context: MarkdownRenderContext): void {
    provide(MARKDOWN_CONTEXT_KEY, context)
}

export function injectMarkdownContext(): MarkdownRenderContext {
    const context = inject(MARKDOWN_CONTEXT_KEY)
    if (!context) {
        throw new Error('[markdown] injectMarkdownContext() must be used within <Markdown>.')
    }
    return context
}
