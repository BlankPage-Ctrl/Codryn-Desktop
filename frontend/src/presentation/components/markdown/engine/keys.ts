import type { ParsedNode, SyntaxTree } from '../types'

export interface NodeKeySource {
    type: string
    identifier?: string | number
}

export function makeNodeKey(node: NodeKeySource, index: number, baseKey = 'markdown'): string {
    const nodeKey = `${baseKey}-${node.type}`
    if (node.type === 'footnoteReference' || node.type === 'footnoteDefinition') {
        return `${nodeKey}-${node.identifier}`
    }
    return `${nodeKey}-${index}`
}

export function findDeepestLeaf(nodes: ParsedNode[]): ParsedNode | null {
    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i]
        const nodeWithChildren = node as { children?: ParsedNode[] }
        if (nodeWithChildren.children && nodeWithChildren.children.length > 0) {
            const found = findDeepestLeaf(nodeWithChildren.children)
            if (found) return found
            continue
        }
        return node ?? null
    }
    return null
}

export function stampLoadingLeaf(ast: SyntaxTree): SyntaxTree {
    const target = findDeepestLeaf(ast.children)
    if (!target) return ast
    return updateNodeLoading(ast, target, true)
}

export function hasLoadingNode(nodes?: ParsedNode[]): boolean {
    if (!nodes || nodes.length === 0) return false

    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i]
        if (node?.loading) return true
        const nodeWithChildren = node as { children?: ParsedNode[] }
        if (
            nodeWithChildren.children &&
            nodeWithChildren.children.length > 0 &&
            hasLoadingNode(nodeWithChildren.children)
        ) {
            return true
        }
    }
    return false
}

function updateNodeLoading(ast: SyntaxTree, targetNode: ParsedNode, loading: boolean): SyntaxTree {
    const cloneNode = (node: ParsedNode): [ParsedNode, boolean] => {
        if (node === targetNode) {
            if (Boolean(node.loading) === loading) return [node, false]
            return [{ ...node, loading }, true]
        }

        const nodeWithChildren = node as { children?: ParsedNode[] }
        const children = nodeWithChildren.children
        if (!children || children.length === 0) return [node, false]

        let changed = false
        const nextChildren: ParsedNode[] = Array.from({ length: children.length })
        for (let i = 0; i < children.length; i++) {
            const child = children[i]!
            const [nextChild, childChanged] = cloneNode(child)
            nextChildren[i] = nextChild
            changed = changed || childChanged
        }

        if (!changed) return [node, false]

        return [
            {
                ...node,
                // @ts-expect-error children types are rebuilt recursively
                children: nextChildren,
            },
            true,
        ]
    }

    let changed = false
    const nextChildren: ParsedNode[] = Array.from({ length: ast.children.length })
    for (let i = 0; i < ast.children.length; i++) {
        const child = ast.children[i]!
        const [nextChild, childChanged] = cloneNode(child)
        nextChildren[i] = nextChild
        changed = changed || childChanged
    }
    if (!changed) return ast

    return {
        ...ast,
        children: nextChildren,
    }
}
