import type { RootContent } from 'mdast'
import type { Component } from 'vue'

export type ParsedNode = RootContent & { loading?: boolean }

export interface SyntaxTree {
    type: 'root'
    children: ParsedNode[]
}

export interface RenderItem {
    key: string
    node: ParsedNode
    renderer?: Component
}

export interface RenderChunk {
    key: string
    items: RenderItem[]
}
