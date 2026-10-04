import type { Ref } from 'vue'

export interface KeyModifiers {
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    meta?: boolean
}

export interface ShortcutConfig {
    key: string
    modifiers?: KeyModifiers
    handler: (e: KeyboardEvent) => void
    disabled?: Ref<boolean> | boolean
    description?: string
    preventDefault?: boolean
    stopPropagation?: boolean
}

export interface ShortcutManager {
    register: (config: ShortcutConfig) => () => void
    unregister: (id: string) => void
    enable: (id: string) => void
    disable: (id: string) => void
    getAll: () => ShortcutConfig[]
}
