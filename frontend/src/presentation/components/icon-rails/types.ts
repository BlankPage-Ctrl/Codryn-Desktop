import type { Component } from 'vue'

export type IconRailsSize = 'xs' | 'sm' | 'md'

export interface IconRailsItem {
    id: string
    icon: Component
    ariaLabel: string
    tooltip?: string
    active?: boolean
    disabled?: boolean
    onClick?: (item: IconRailsItem) => void
}

export interface IconRailsSchema {
    items: IconRailsItem[]
    size?: IconRailsSize
    vertical?: boolean
    class?: string
}

export interface IconRailsClasses {
    root: string
    item: string
    itemActive: string
    itemDisabled: string
}
