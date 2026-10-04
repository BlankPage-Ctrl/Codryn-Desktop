import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { dirname, basename } from '@/shared/utils/path.utils'
import type {
    FEFileNode,
    FELoadState,
    FETreeItem,
    RelPath,
    FEListDirData,
    FEMeta,
    FEWatchEvent,
} from '@/core/entities'

export const useFileExplorerStorer = defineStore('file-explorer', () => {
    const nodeMap = ref<Record<RelPath, FEFileNode>>({})
    const loadStateMap = ref<Record<RelPath, FELoadState>>({})
    const expandedPaths = ref(new Set<RelPath>())
    const selectedPath = ref<RelPath | null>(null)
    const rootPath = ref<RelPath>('.')
    const workspaceRoot = ref<string | undefined>(undefined)
    const searchResults = ref<FEFileNode[]>([])

    const visibleList = computed<FETreeItem[]>(() => {
        const result: FETreeItem[] = []
        const root = nodeMap.value[rootPath.value]
        if (!root?.children) return result

        function traverse(parentPath: RelPath, depth: number): void {
            const parent = nodeMap.value[parentPath]
            if (!parent?.children) return

            const children = parent.children
                .map((p) => nodeMap.value[p])
                .filter((n): n is FEFileNode => n !== undefined)
                .sort((a, b) => {
                    if (a.isDirectory !== b.isDirectory) {
                        return a.isDirectory ? -1 : 1
                    }
                    return a.name.localeCompare(b.name)
                })

            for (const child of children) {
                result.push({
                    node: child,
                    depth,
                    isExpanded: expandedPaths.value.has(child.path),
                    isLoading: loadStateMap.value[child.path] === 'loading',
                    isSelected: selectedPath.value === child.path,
                })

                if (child.isDirectory && expandedPaths.value.has(child.path)) {
                    traverse(child.path, depth + 1)
                }
            }
        }

        traverse(rootPath.value, 0)
        return result
    })

    function getNode(path: RelPath): FEFileNode | undefined {
        return nodeMap.value[path]
    }

    function getLoadState(path: RelPath): FELoadState {
        return loadStateMap.value[path] ?? 'idle'
    }

    function isExpanded(path: RelPath): boolean {
        return expandedPaths.value.has(path)
    }

    function upsertNodes(nodes: FEFileNode[]): void {
        const next = { ...nodeMap.value }
        for (const node of nodes) {
            next[node.path] = node
        }
        nodeMap.value = next
    }

    function setLoadState(path: RelPath, state: FELoadState): void {
        loadStateMap.value[path] = state
    }

    function toggleExpand(path: RelPath): void {
        const node = nodeMap.value[path]
        if (!node?.isDirectory) return

        const next = new Set(expandedPaths.value)
        if (next.has(path)) {
            next.delete(path)
        } else {
            next.add(path)
        }
        expandedPaths.value = next
    }

    function selectNode(path: RelPath | null): void {
        selectedPath.value = path
    }

    function setSearchResults(nodes: FEFileNode[]): void {
        searchResults.value = nodes
    }

    function loadInitial(data: FEListDirData, meta?: FEMeta): void {
        rootPath.value = data.requestedPath
        if (meta?.workspaceRoot) {
            workspaceRoot.value = meta.workspaceRoot
        }

        upsertNodes(data.nodes)

        if (!nodeMap.value[data.requestedPath]) {
            nodeMap.value[data.requestedPath] = {
                id: '',
                name: basename(data.requestedPath),
                path: data.requestedPath,
                type: 'directory',
                isDirectory: true,
                hasChildren: data.nodes.length > 0,
                children: data.nodes.length > 0 ? data.nodes.map((n) => n.path) : undefined,
            }
        }

        setLoadState(data.requestedPath, 'loaded')
    }

    function loadChildren(data: FEListDirData): void {
        const path = data.requestedPath
        const parent = nodeMap.value[path]
        if (!parent) return

        upsertNodes(data.nodes)

        const updated = { ...parent }
        updated.children = data.nodes.map((n) => n.path)
        updated.hasChildren = data.nodes.length > 0
        nodeMap.value[path] = updated

        setLoadState(path, 'loaded')
    }

    function removeNodeRecursive(path: RelPath): void {
        const node = nodeMap.value[path]
        if (!node) return

        for (const childPath of node.children ?? []) {
            removeNodeRecursive(childPath)
        }

        const nextMap = { ...nodeMap.value }
        delete nextMap[path]
        nodeMap.value = nextMap

        const nextLS = { ...loadStateMap.value }
        delete nextLS[path]
        loadStateMap.value = nextLS

        const nextExp = new Set(expandedPaths.value)
        nextExp.delete(path)
        expandedPaths.value = nextExp
    }

    function applyWatchEvent(event: FEWatchEvent): void {
        const { type, node } = event

        switch (type) {
            case 'CREATED': {
                nodeMap.value[node.path] = node
                const parentPath = dirname(node.path)
                const parent = nodeMap.value[parentPath]
                if (parent?.children && !parent.children.includes(node.path)) {
                    const updated = { ...parent }
                    updated.children = [...(updated.children ?? []), node.path]
                    nodeMap.value[parentPath] = updated
                }
                break
            }

            case 'DELETED': {
                removeNodeRecursive(node.path)
                const parentPath = dirname(node.path)
                const parent = nodeMap.value[parentPath]
                if (parent?.children) {
                    const updated = { ...parent }
                    updated.children = (updated.children ?? []).filter((p) => p !== node.path)
                    nodeMap.value[parentPath] = updated
                }
                if (selectedPath.value === node.path) {
                    selectedPath.value = null
                }
                break
            }

            case 'MODIFIED': {
                const existing = nodeMap.value[node.path]
                if (existing) {
                    nodeMap.value[node.path] = {
                        ...existing,
                        ...node,
                        children: existing.children ?? node.children,
                    }
                }
                break
            }

            case 'MOVED': {
                if (!event.oldPath) break

                const oldParentPath = dirname(event.oldPath)
                const oldParent = nodeMap.value[oldParentPath]
                if (oldParent?.children) {
                    const updated = { ...oldParent }
                    updated.children = (updated.children ?? []).filter((p) => p !== event.oldPath)
                    nodeMap.value[oldParentPath] = updated
                }

                const wasExpanded = expandedPaths.value.has(event.oldPath)
                removeNodeRecursive(event.oldPath)

                nodeMap.value[node.path] = node
                if (wasExpanded && node.isDirectory) {
                    const next = new Set(expandedPaths.value)
                    next.add(node.path)
                    expandedPaths.value = next
                }

                const newParentPath = dirname(node.path)
                const newParent = nodeMap.value[newParentPath]
                if (newParent?.children && !newParent.children.includes(node.path)) {
                    const updated = { ...newParent }
                    updated.children = [...(updated.children ?? []), node.path]
                    nodeMap.value[newParentPath] = updated
                }

                if (selectedPath.value === event.oldPath) {
                    selectedPath.value = node.path
                }
                break
            }
        }
    }

    function reset(data: FEListDirData, meta?: FEMeta): void {
        nodeMap.value = {}
        loadStateMap.value = {}
        expandedPaths.value = new Set()
        selectedPath.value = null
        searchResults.value = []
        loadInitial(data, meta)
    }

    return {
        nodeMap,
        loadStateMap,
        expandedPaths,
        selectedPath,
        rootPath,
        workspaceRoot,
        searchResults,
        visibleList,
        getNode,
        getLoadState,
        isExpanded,
        setLoadState,
        toggleExpand,
        selectNode,
        setSearchResults,
        loadInitial,
        loadChildren,
        applyWatchEvent,
        reset,
    }
})

export type FileExplorerStorer = ReturnType<typeof useFileExplorerStorer>
