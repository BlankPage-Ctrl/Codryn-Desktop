import type { RouteLocationRaw } from 'vue-router'
import type { ButtonType } from './schema'

export type ButtonNativeAttrs = {
    readonly tag: 'button'
    readonly type?: ButtonType
    readonly disabled?: boolean
    readonly autofocus?: boolean
}

export type ButtonLinkAttrs = {
    readonly tag: 'a'
    readonly href?: string
    readonly target?: '_blank' | '_self'
    readonly rel?: string
}

export type ButtonRouterAttrs = {
    readonly tag: 'router-link'
    readonly to?: RouteLocationRaw
}

export type ButtonTagAttrs = ButtonNativeAttrs | ButtonLinkAttrs | ButtonRouterAttrs
