import QuickLRU from 'quick-lru'
import type { SyntaxTree } from '../types'

export interface AstCache {
    get(key: string): SyntaxTree | undefined
    set(key: string, value: SyntaxTree): SyntaxTree
    clear(): void
}

export function createAstCache(maxSize = 100): AstCache {
    const cache = new QuickLRU<string, SyntaxTree>({ maxSize })

    return {
        get: (key) => cache.get(key),
        set: (key, value) => {
            cache.set(key, value)
            return value
        },
        clear: () => cache.clear(),
    }
}
