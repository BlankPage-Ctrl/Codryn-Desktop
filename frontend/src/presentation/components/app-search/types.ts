import type { Component } from 'vue'
import type { Workspace, Chat, Note, FEFileNode } from '@/core/entities'

export type AppSearchKind = 'workspace' | 'chat' | 'note' | 'file' | 'folder' | 'setting' | 'action'

export interface AppSearchFlag {
    label: string
    tone?: 'default' | 'info' | 'muted'
}

export interface AppSearchItemBase {
    id: string
    kind: AppSearchKind
    title: string
    desc?: string
    icon?: Component
    flags: AppSearchFlag[]
}

export type AppSearchPayloadMap = {
    workspace: Workspace
    chat: Chat
    note: Note
    file: FEFileNode
    folder: FEFileNode
    setting: { key: string; label: string }
    action: { command: string; args?: Record<string, unknown> }
}

export type AppSearchItem<K extends AppSearchKind = AppSearchKind> = AppSearchItemBase & {
    kind: K
    payload: AppSearchPayloadMap[K]
}

export type AppSearchItemAny =
    | AppSearchItem<'workspace'>
    | AppSearchItem<'chat'>
    | AppSearchItem<'note'>
    | AppSearchItem<'file'>
    | AppSearchItem<'folder'>
    | AppSearchItem<'setting'>
    | AppSearchItem<'action'>

export type AppSearchSelectPayload = AppSearchItemAny
