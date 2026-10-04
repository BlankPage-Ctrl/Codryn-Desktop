import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFileExplorerStorer } from '../file-explorer.storer'
import type { FEFileNode, FEWatchEvent } from '@/core/entities'

function node(path: string, isDirectory = false): FEFileNode {
    return {
        id: path,
        name: path.split('/').pop() ?? path,
        path,
        type: isDirectory ? 'directory' : 'file',
        isDirectory,
    }
}

function event(type: FEWatchEvent['type'], n: FEFileNode, oldPath?: string): FEWatchEvent {
    return { type, node: n, oldPath, timestamp: Date.now() }
}

function seedTree(store: ReturnType<typeof useFileExplorerStorer>) {
    const src = node('src', true)
    const a = node('src/a.ts')
    const b = node('src/b.ts')
    store.loadInitial({ requestedPath: '.', nodes: [src] })
    store.loadChildren({ requestedPath: 'src', nodes: [a, b] })
    return { src, a, b }
}

describe('file-explorer storer searchResults', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('setSearchResults stores the nodes and reset clears them', () => {
        const store = useFileExplorerStorer()
        const a = node('src/a.ts')

        store.setSearchResults([a])
        expect(store.searchResults).toEqual([a])

        store.reset({ requestedPath: '.', nodes: [] })
        expect(store.searchResults).toEqual([])
    })
})

describe('file-explorer storer applyWatchEvent', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('MODIFIED keeps the existing children list', () => {
        const store = useFileExplorerStorer()
        seedTree(store)

        // watch-event nodes never carry `children`
        store.applyWatchEvent(event('MODIFIED', node('src', true)))

        expect(store.getNode('src')?.children).toEqual(['src/a.ts', 'src/b.ts'])
        expect(store.getNode('src')?.hasChildren).toBe(true)
    })

    it('CREATED does not duplicate a child entry', () => {
        const store = useFileExplorerStorer()
        seedTree(store)

        store.applyWatchEvent(event('CREATED', node('src/a.ts')))
        store.applyWatchEvent(event('CREATED', node('src/a.ts')))

        expect(store.getNode('src')?.children).toEqual(['src/a.ts', 'src/b.ts'])
    })

    it('DELETED removes the subtree, its load state and expansion', () => {
        const store = useFileExplorerStorer()
        seedTree(store)
        store.toggleExpand('src')
        store.setLoadState('src', 'loaded')

        store.applyWatchEvent(event('DELETED', node('src', true)))

        expect(store.getNode('src')).toBeUndefined()
        expect(store.getNode('src/a.ts')).toBeUndefined()
        expect(store.isExpanded('src')).toBe(false)
        expect(store.getNode('.')?.children).toEqual([])
    })

    it('MOVED re-homes the node, keeps expansion and moves selection', () => {
        const store = useFileExplorerStorer()
        seedTree(store)
        store.toggleExpand('src')
        store.selectNode('src/a.ts')

        store.applyWatchEvent(event('MOVED', node('src/c.ts'), 'src/a.ts'))

        expect(store.getNode('src/c.ts')?.path).toBe('src/c.ts')
        expect(store.getNode('src/a.ts')).toBeUndefined()
        expect(store.getNode('src')?.children).toEqual(['src/b.ts', 'src/c.ts'])
        expect(store.selectedPath).toBe('src/c.ts')
    })

    it('MOVED to a new parent links the new parent children', () => {
        const store = useFileExplorerStorer()
        const src = node('src', true)
        const lib = node('lib', true)
        store.loadInitial({ requestedPath: '.', nodes: [src, lib] })
        store.loadChildren({ requestedPath: 'src', nodes: [node('src/a.ts')] })
        store.loadChildren({ requestedPath: 'lib', nodes: [] })

        store.applyWatchEvent(event('MOVED', node('lib/a.ts'), 'src/a.ts'))

        expect(store.getNode('src')?.children).toEqual([])
        expect(store.getNode('lib')?.children).toEqual(['lib/a.ts'])
    })
})
