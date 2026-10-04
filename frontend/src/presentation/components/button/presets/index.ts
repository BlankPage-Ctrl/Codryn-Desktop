import type { ButtonSchema } from '../types/schema'

export const BUTTON_PRESETS = {
    primary: {
        variant: 'solid',
        size: 'md',
        radius: 'md',
        ripple: true,
        pressScale: true,
    },
    secondary: {
        variant: 'outline',
        size: 'md',
        radius: 'md',
        ripple: false,
    },
    danger: {
        variant: 'solid',
        size: 'md',
        radius: 'md',
        ripple: true,
        pressScale: true,
    },
    ghost: {
        variant: 'ghost',
        size: 'md',
        radius: 'md',
        ripple: false,
    },
    link: {
        variant: 'link',
        size: 'md',
        radius: 'none',
        ripple: false,
        tag: 'a',
    },
    'icon-only': {
        variant: 'ghost',
        size: 'md',
        radius: 'full',
        iconPosition: 'only',
        ripple: true,
    },
} as const satisfies Record<string, Partial<ButtonSchema>>

export type ButtonPresetKey = keyof typeof BUTTON_PRESETS
