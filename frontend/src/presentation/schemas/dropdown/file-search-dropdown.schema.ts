import type { DropdownItemConfig, DropdownProps } from '@/presentation/components/dropdown/types'
import { resolveFileIconComponent } from '@/presentation/composables/useFileIcon'
import { dirname } from '@/shared/utils/path.utils'
import type { FEFileNode } from '@/core/entities'

export interface FileSearchDropdownParams {
    query: string
    nodes: FEFileNode[]
    workspaceRoot?: string
}

function pathLabel(node: FEFileNode): string {
    const dir = dirname(node.path)
    const dirText = dir === '.' || dir === '/' ? '' : dir
    return dirText ? `${dirText} - ${node.name}` : node.name
}

function fullPath(node: FEFileNode, workspaceRoot?: string): string {
    if (workspaceRoot && node.path !== '.') return `${workspaceRoot}/${node.path}`
    return node.path
}

export function createFileSearchDropdownItems(
    params: FileSearchDropdownParams,
): DropdownItemConfig[] {
    const q = params.query.trim().toLowerCase()
    if (!q) return []

    return params.nodes
        .filter(
            (node) => node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q),
        )
        .map((node) => ({
            id: node.path,
            label: pathLabel(node),
            icon: resolveFileIconComponent(node.path, node.isDirectory),
            value: node.path,
            title: fullPath(node, params.workspaceRoot),
        }))
}

export const fileSearchDropdownProps: Pick<
    DropdownProps,
    'mode' | 'placement' | 'width' | 'offset' | 'dense' | 'showIcon' | 'style'
> = {
    mode: 'menu',
    placement: 'bottom',
    width: { mode: 'match-trigger', padding: 0 },
    offset: 4,
    dense: true,
    showIcon: true,
    style: {
        menu: {
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '2px',
        },
        item: {
            borderRadius: '4px',
            hoverBackground: 'rgba(var(--raw-border-color), 0.3)',
            selectedBackground: 'rgba(var(--raw-border-color), 0.3)',
        },
    },
}
