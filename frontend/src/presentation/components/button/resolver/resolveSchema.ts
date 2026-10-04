import type { ButtonSchema } from '../types/schema'
import type { ButtonClasses, ResolvedButton } from '../types/resolved'
import { BUTTON_PRESETS } from '../presets'

type RequiredSchema = Required<
    Omit<
        ButtonSchema,
        | 'label'
        | 'icon'
        | 'href'
        | 'to'
        | 'preset'
        | 'overrides'
        | 'ariaLabel'
        | 'ariaExpanded'
        | 'ariaPressed'
        | 'ariaDescribedby'
        | 'fontFamily'
        | 'fontSize'
        | 'fontWeight'
    >
>

const DEFAULT_SCHEMA: RequiredSchema = {
    variant: 'solid',
    size: 'md',
    radius: 'md',
    iconPosition: 'left',
    tag: 'button',
    type: 'button',
    target: '_self',
    fullWidth: false,
    loading: false,
    disabled: false,
    ripple: false,
    pressScale: false,
}

const FONT_FAMILY_MAP: Record<string, string> = {
    serif: 'var(--font-serif)',
    sans: 'var(--font-body)',
    mono: 'var(--font-mono)',
}

const FONT_SIZE_MAP: Record<string, string> = {
    '2xs': 'var(--type-2xs)',
    xs: 'var(--type-xs)',
    sm: 'var(--type-sm)',
    md: 'var(--type-md)',
    lg: 'var(--type-lg)',
    xl: 'var(--type-xl)',
    '2xl': 'var(--type-2xl)',
}

const FONT_WEIGHT_MAP: Record<string, string> = {
    normal: 'var(--font-weight-normal)',
    medium: 'var(--font-weight-medium)',
    semibold: 'var(--font-weight-semibold)',
    bold: 'var(--font-weight-bold)',
}

export function resolveButtonSchema(schema: ButtonSchema): ResolvedButton {
    const presetBase = schema.preset
        ? (BUTTON_PRESETS[schema.preset as keyof typeof BUTTON_PRESETS] ?? {})
        : {}

    const merged: ButtonSchema = {
        ...DEFAULT_SCHEMA,
        ...presetBase,
        ...schema,
        ...schema.overrides,
    }

    const isIconOnly = !!(
        merged.iconPosition === 'only' ||
        (merged.iconPosition == null && merged.icon && !merged.label)
    )
    const showLabel = !isIconOnly && !!merged.label
    const showIcon = !!merged.icon
    const isDisabled = !!(merged.disabled || merged.loading)

    const tagAttrs = computeTagAttrs(merged, isDisabled)
    const ariaAttrs = computeAriaAttrs(merged, isDisabled)
    const style = computeStyle(merged)
    const classes = computeClasses(merged, isIconOnly)

    return {
        tag: merged.tag!,
        attrs: { ...ariaAttrs, ...tagAttrs, ...(style ? { style } : {}) },
        classes,
        content: {
            label: merged.label,
            icon: merged.icon,
            iconPosition: merged.iconPosition!,
            showLabel,
            showIcon,
            showSpinner: !!merged.loading,
        },
        interaction: {
            ripple: merged.ripple!,
            pressScale: merged.pressScale!,
            isDisabled,
        },
    }
}

function computeTagAttrs(merged: ButtonSchema, isDisabled: boolean): Record<string, unknown> {
    switch (merged.tag) {
        case 'button':
            return {
                type: merged.type,
                disabled: isDisabled || undefined,
            }
        case 'a':
            return {
                href: merged.href,
                target: merged.target,
                rel: merged.target === '_blank' ? 'noopener noreferrer' : undefined,
            }
        case 'router-link':
            return { to: merged.to }
        default:
            return {}
    }
}

function computeAriaAttrs(merged: ButtonSchema, isDisabled: boolean): Record<string, unknown> {
    const aria: Record<string, unknown> = {}
    if (merged.ariaLabel) aria['aria-label'] = merged.ariaLabel
    if (merged.ariaExpanded !== undefined) aria['aria-expanded'] = merged.ariaExpanded
    if (merged.ariaPressed !== undefined) aria['aria-pressed'] = merged.ariaPressed
    if (merged.ariaDescribedby) aria['aria-describedby'] = merged.ariaDescribedby
    if (isDisabled) aria['aria-disabled'] = true
    return aria
}

function computeClasses(merged: ButtonSchema, isIconOnly: boolean): ButtonClasses {
    return {
        root: [
            'btn',
            `btn--${merged.variant}`,
            `btn--${merged.size}`,
            `btn--radius-${merged.radius}`,
            merged.preset === 'danger' ? 'btn--danger' : '',
            merged.fullWidth ? 'btn--full' : '',
            isIconOnly ? 'btn--icon-only' : '',
            merged.loading ? 'btn--loading' : '',
            merged.disabled ? 'btn--disabled' : '',
        ]
            .filter(Boolean)
            .join(' '),

        inner: 'btn__inner',
        label: 'btn__label',
        icon: 'btn__icon',
        spinner: 'btn__spinner',
    }
}

function computeStyle(merged: ButtonSchema): Record<string, string> | undefined {
    const style: Record<string, string> = {}

    const fontFamily = mapToken(merged.fontFamily, FONT_FAMILY_MAP)
    if (fontFamily) style.fontFamily = fontFamily

    const fontSize = mapToken(merged.fontSize, FONT_SIZE_MAP)
    if (fontSize) style.fontSize = fontSize

    const fontWeight = mapToken(merged.fontWeight, FONT_WEIGHT_MAP)
    if (fontWeight) style.fontWeight = fontWeight

    return Object.keys(style).length ? style : undefined
}

function mapToken(value: string | undefined, map: Record<string, string>): string | undefined {
    if (value == null || value === '') return undefined
    return map[value] ?? value
}
