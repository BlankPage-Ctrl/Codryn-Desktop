import type { Component } from 'vue'

export interface TabItem<T = string> {
    id: T
    title: string
    icon?: Component
    closable?: boolean
    loading?: boolean
    badge?: string | number
}

export interface TabStripSchema<T = string> {
    tabs: ReadonlyArray<TabItem<T>>
    activeId?: T | null
    closable?: boolean
    onSelect?: (id: T) => void
    onClose?: (id: T) => void
    class?: string
}

export interface TabStripClasses {
    root: string
    item: string
    itemActive: string
    itemClose: string
}
