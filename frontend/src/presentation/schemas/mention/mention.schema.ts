import { resolveFileIconComponent } from '@/presentation/composables/useFileIcon'
import { dirname } from '@/shared/utils/path.utils'
import { buildInsertText } from '@/shared/utils/mention.utils'
import type { MentionItem, MentionKind, SymbolMentionMeta } from '@/core/entities/mention'
import type { FEInsightSearchHit } from '@/core/entities/insight'
import type { FEFileNode } from '@/core/entities/file'

export interface CreateMentionItemsParams {
    query: string
    nodes: FEFileNode[]
    workspaceRoot?: string
    maxResults?: number
}

function pathLabel(node: FEFileNode): string {
    return node.name
}

function pathDescription(node: FEFileNode): string {
    const dir = dirname(node.path)
    const dirText = dir === '.' || dir === '/' ? '' : dir
    return dirText ? `${dirText}/${node.name}` : node.name
}

export function createMentionItemsFromFiles(params: CreateMentionItemsParams): MentionItem[] {
    const q = params.query.trim().toLowerCase()
    const limit = params.maxResults ?? 12

    let filtered = params.nodes
    if (q) {
        filtered = filtered.filter(
            (n) => n.name.toLowerCase().includes(q) || n.path.toLowerCase().includes(q),
        )
    }

    return filtered.slice(0, limit).map((node) => {
        const kind = node.isDirectory ? 'folder' : 'file'
        const insertText = buildInsertText(kind, node.path)
        const description = pathDescription(node)
        const title = params.workspaceRoot ? `${params.workspaceRoot}/${node.path}` : node.path
        return {
            id: node.path,
            kind,
            label: pathLabel(node),
            description,
            title,
            icon: resolveFileIconComponent(node.path, node.isDirectory),
            meta: { path: node.path, isDirectory: node.isDirectory },
            insertText,
        } satisfies MentionItem
    })
}

export interface CreateMentionSymbolItemsParams {
    hits: FEInsightSearchHit[]
    maxResults?: number
}

export function createMentionItemsFromSymbols(
    params: CreateMentionSymbolItemsParams,
): MentionItem[] {
    const limit = params.maxResults ?? 8

    return params.hits.slice(0, limit).map((hit) => {
        const lineStart = hit.lineRange?.start ?? 0
        const lineEnd = hit.lineRange?.end ?? 0
        const qualified = hit.qualifiedName || hit.name
        const where = `${hit.filePath}:${lineStart}-${lineEnd}`
        const meta: SymbolMentionMeta = {
            id: hit.id,
            name: hit.name,
            qualifiedName: qualified,
            kind: hit.kind,
            filePath: hit.filePath,
            lineStart,
            lineEnd,
        }
        return {
            id: `symbol:${hit.id}`,
            kind: 'symbol',
            label: hit.name || qualified,
            description: `${qualified} - ${where}`,
            title: where,
            icon: resolveFileIconComponent(hit.filePath, false),
            meta,
            insertText: buildInsertText('symbol', hit.id),
        } satisfies MentionItem
    })
}

export function createMentionItems<T>(
    raw: Array<{
        id: string
        label: string
        description?: string
        kind: MentionKind
        meta: T
        insertText: string
        icon?: MentionItem['icon']
    }>,
): MentionItem[] {
    return raw.map((r) => ({
        id: r.id,
        kind: r.kind,
        label: r.label,
        description: r.description,
        icon: r.icon,
        meta: r.meta as unknown as Record<string, unknown>,
        insertText: r.insertText,
    }))
}
