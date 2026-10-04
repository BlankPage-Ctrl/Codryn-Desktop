import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'soft' | 'link'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type ButtonRadius = 'none' | 'sm' | 'md' | 'lg' | 'full'
export type ButtonType = 'button' | 'submit' | 'reset'
export type IconPosition = 'left' | 'right' | 'only'
export type ButtonTag = 'button' | 'a' | 'router-link'
export type ButtonFontFamily = 'serif' | 'sans' | 'mono' | (string & {})
export type ButtonFontSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | (string & {})
export type ButtonFontWeight = 'normal' | 'medium' | 'semibold' | 'bold' | (string & {})

export interface ButtonSchema {
    readonly label?: string
    readonly icon?: string | Component
    readonly iconPosition?: IconPosition

    readonly variant?: ButtonVariant
    readonly size?: ButtonSize
    readonly radius?: ButtonRadius
    readonly fullWidth?: boolean

    readonly fontFamily?: ButtonFontFamily
    readonly fontSize?: ButtonFontSize
    readonly fontWeight?: ButtonFontWeight

    readonly tag?: ButtonTag
    readonly type?: ButtonType
    readonly href?: string
    readonly to?: RouteLocationRaw
    readonly target?: '_blank' | '_self'

    readonly loading?: boolean
    readonly disabled?: boolean

    readonly ripple?: boolean
    readonly pressScale?: boolean

    readonly ariaLabel?: string
    readonly ariaExpanded?: boolean
    readonly ariaPressed?: boolean | 'mixed'
    readonly ariaDescribedby?: string

    readonly preset?: string
    readonly overrides?: Omit<ButtonSchema, 'preset' | 'overrides'>
}
