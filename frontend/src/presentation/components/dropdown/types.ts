import type { Component } from 'vue'

export type DropdownMode = 'menu' | 'select' | 'multi-select' | 'search-list'
export type DropdownPlacement = 'top' | 'bottom'
export type TriggerMode = 'click' | 'contextmenu' | 'hover'
export type ItemType = 'item' | 'separator' | 'label'

export interface CommandAction {
    type: 'command'
    command: string
    args?: Record<string, unknown>
}

export interface SubmenuAction {
    type: 'submenu'
}

export type ItemAction = CommandAction | SubmenuAction

export interface DropdownItemConfig<T = string> {
    id: string
    label?: string
    title?: string
    type?: ItemType
    icon?: Component
    rightIcon?: Component
    rightAction?: CommandAction
    shortcut?: string
    group?: string
    order?: number
    enabled?: boolean
    visible?: boolean
    danger?: boolean
    action?: ItemAction
    children?: DropdownItemConfig<T>[]
    value?: T
    providerId?: string
    selected?: boolean
}

export type WidthStrategy =
    | { mode: 'auto' }
    | { mode: 'match-trigger'; padding?: number }
    | { mode: 'fixed'; width: number }

export interface MenuStyle {
    background?: string
    border?: string
    borderRadius?: string
    shadow?: string
    padding?: string
}

export interface ItemStyle {
    padding?: string
    fontSize?: string
    color?: string
    borderRadius?: string
    hoverBackground?: string
    focusedBackground?: string
    selectedBackground?: string
    disabledOpacity?: number
}

export interface StyleConfig {
    menu?: MenuStyle
    item?: ItemStyle
}

export interface DropdownProps<T = string> {
    items: DropdownItemConfig<T>[]
    modelValue?: T | T[] | null
    mode?: DropdownMode
    placement?: DropdownPlacement
    triggerMode?: TriggerMode
    width?: WidthStrategy
    maxHeight?: number
    minWidth?: number
    dense?: boolean
    disabled?: boolean
    offset?: number
    showIcon?: boolean
    style?: StyleConfig
}

export interface DropdownEmits<T = string> {
    (e: 'update:modelValue', value: T | T[] | null): void
    (e: 'select', value: T): void
    (e: 'action', action: CommandAction): void
    (e: 'open'): void
    (e: 'close'): void
}

export interface DropdownContext {
    activeDescendant: string | null
    isOpen: boolean
    open: () => void
    close: () => void
    toggle: () => void
    focusedIndex: number
    setFocusedIndex: (index: number) => void
    selectFocused: () => void
}
