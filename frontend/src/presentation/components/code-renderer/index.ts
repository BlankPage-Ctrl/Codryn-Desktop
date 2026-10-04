export { default as CodeRenderer } from './CodeRenderer.vue'

export * from './types/schema'

export { resolveCodeRendererSchema } from './resolver/resolveCodeRendererSchema'
export { DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME } from './resolver/resolveCodeRendererSchema'

export { useCodeRenderer } from './composables/useCodeRenderer'

export {
    toTokensCached,
    resolveLanguage,
    disposeHighlighter,
    getHighlighter,
    type HighlightLanguage,
} from './engine/highlighter'
