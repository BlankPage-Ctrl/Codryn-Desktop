import type { Component } from 'vue'
import type { ButtonTagAttrs } from './attrs'
import type { IconPosition } from './schema'

export interface ButtonClasses {
    readonly root: string
    readonly inner: string
    readonly label: string
    readonly icon: string
    readonly spinner: string
}

export interface ResolvedContent {
    readonly label?: string
    readonly icon?: string | Component
    readonly iconPosition: IconPosition
    readonly showLabel: boolean
    readonly showIcon: boolean
    readonly showSpinner: boolean
}

export interface ResolvedInteraction {
    readonly ripple: boolean
    readonly pressScale: boolean
    readonly isDisabled: boolean
}

export interface ResolvedButton {
    readonly tag: ButtonTagAttrs['tag']
    readonly attrs: Record<string, unknown>
    readonly classes: ButtonClasses
    readonly content: ResolvedContent
    readonly interaction: ResolvedInteraction
}
