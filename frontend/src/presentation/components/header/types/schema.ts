import type { Component } from 'vue'

export type HeaderWidth = 'auto' | 'full'
export type HeaderHeight = 'auto' | 'sm' | 'md' | 'lg'
export type HeaderPadding = 'none' | 'sm' | 'md' | 'lg'
export type HeaderVariant = 'default' | 'sidebar' | 'workspace' | 'split'

export interface HeaderAction {
    readonly icon?: Component
    readonly label?: string
    readonly ariaLabel: string
    readonly onClick: () => void
    readonly disabled?: boolean
}

export interface HeaderSchema {
    readonly variant?: HeaderVariant
    readonly title: string
    readonly subtitle?: string
    readonly width?: HeaderWidth
    readonly height?: HeaderHeight
    readonly padding?: HeaderPadding
    readonly actions?: HeaderAction[]
    readonly border?: boolean
    readonly class?: string
}
