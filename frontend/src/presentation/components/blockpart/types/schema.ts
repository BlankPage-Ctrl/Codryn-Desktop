import type { Component } from 'vue'

export type BlockPartVariant = 'default' | 'compact' | 'detailed'
export type BlockPartViewMode = 'preview' | 'source'
export type BlockPartSourceFormat = 'json' | 'text'
export type BlockPartStatus = 'idle' | 'streaming' | 'done'

export interface BlockPartPreviewConfig {
    component: Component
    props?: Record<string, unknown>
}

export interface BlockPartSourceConfig {
    component?: Component
    props?: Record<string, unknown>
    data?: unknown
    format?: BlockPartSourceFormat
}

export interface BlockPartAction {
    id?: string
    icon: Component | string
    ariaLabel: string
    tooltip?: string
    disabled?: boolean
    onClick: (e: MouseEvent) => void | Promise<void>
}

export interface BlockPartSchema {
    title?: string
    icon?: Component | string
    variant?: BlockPartVariant
    collapsible?: boolean
    defaultExpanded?: boolean
    viewToggle?: boolean
    defaultView: BlockPartViewMode
    status?: BlockPartStatus
    actions?: BlockPartAction[]
    preview?: BlockPartPreviewConfig
    source?: BlockPartSourceConfig
    persistenceKey?: string
}

export interface ResolvedBlockPart {
    title: string
    icon?: Component | string
    variant: BlockPartVariant
    collapsible: boolean
    expanded: boolean
    viewToggle: boolean
    viewMode: BlockPartViewMode
    status: BlockPartStatus
    actions: BlockPartAction[]
    hasPreview: boolean
    hasSource: boolean
    preview?: BlockPartPreviewConfig
    source?: BlockPartSourceConfig
    persistenceKey?: string
}
