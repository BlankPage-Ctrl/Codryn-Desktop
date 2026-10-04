import type { Component } from 'vue'

export type MentionKind = 'file' | 'folder'

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

export type AnyMentionMeta = FileMentionMeta | FolderMentionMeta | Record<string, unknown>

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
