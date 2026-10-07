import type { Component } from 'vue'

export type MentionKind = 'file' | 'folder' | 'symbol'

export interface MentionItem<TMeta = unknown> {
    id: string
    kind: MentionKind
    label: string
    description?: string
    title?: string
    icon?: Component
    meta: TMeta
    insertText: string
}

export interface FileMentionMeta {
    path: string
    isDirectory: boolean
    size?: number
}

export interface FolderMentionMeta {
    path: string
    isDirectory: true
}

export interface SymbolMentionMeta {
    id: string
    name: string
    qualifiedName?: string
    kind: string
    filePath: string
    lineStart: number
    lineEnd: number
}

export type AnyMentionMeta =
    | FileMentionMeta
    | FolderMentionMeta
    | SymbolMentionMeta
    | Record<string, unknown>

export interface MentionTriggerRange {
    start: number
    end: number
    kind: '@' | '#'
    prefix: string
}

export interface MentionSelectPayload {
    item: MentionItem
    range: MentionTriggerRange
}
