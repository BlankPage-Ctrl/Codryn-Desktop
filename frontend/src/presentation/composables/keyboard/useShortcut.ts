import { ref, onUnmounted, unref, isRef } from 'vue'
import { useEventListener } from '@vueuse/core'
import type { ShortcutConfig } from './types'

const shortcutRegistry = new Map<
    string,
    {
        config: ShortcutConfig
        cleanup: () => void
    }
>()

let shortcutCounter = 0

function generateShortcutId(config: ShortcutConfig): string {
    return `shortcut-${config.key}-${JSON.stringify(config.modifiers)}-${++shortcutCounter}`
}

function buildKeyString(config: ShortcutConfig): string {
    const parts: string[] = []
    if (config.modifiers?.ctrl) parts.push('Ctrl')
    if (config.modifiers?.shift) parts.push('Shift')
    if (config.modifiers?.alt) parts.push('Alt')
    if (config.modifiers?.meta) parts.push('Cmd')
    parts.push(config.key.toUpperCase())
    return parts.join('+')
}

function matchesShortcut(e: KeyboardEvent, config: ShortcutConfig): boolean {
    const { modifiers = {}, key } = config

    if (modifiers.ctrl && !(e.ctrlKey || e.metaKey)) return false
    if (modifiers.shift && !e.shiftKey) return false
    if (modifiers.alt && !e.altKey) return false
    if (modifiers.meta && !e.metaKey) return false
    return e.key.toLowerCase() === key.toLowerCase()
}

export function useShortcut(config: ShortcutConfig) {
    const {
        handler,
        disabled = false,
        description = '',
        preventDefault = true,
        stopPropagation = false,
    } = config

    const id = generateShortcutId(config)
    const disabledRef = isRef(disabled) ? disabled : ref(disabled)
    const keyString = buildKeyString(config)

    function handleKeyDown(e: KeyboardEvent) {
        if (unref(disabledRef)) return
        if (!matchesShortcut(e, config)) return

        // duplicate detection - warning only, last registered wins
        const duplicate = findDuplicate(config)
        if (duplicate && duplicate.id !== id) {
            console.warn(
                `[useShortcut] Duplicate "${keyString}" — "${duplicate.id}" already registered. Last wins.`,
            )
        }

        if (preventDefault) e.preventDefault()
        if (stopPropagation) e.stopPropagation()
        handler(e)
    }

    function findDuplicate(config: ShortcutConfig) {
        for (const [otherId, entry] of shortcutRegistry) {
            if (otherId === id) continue
            if (entry.config.key.toLowerCase() !== config.key.toLowerCase()) continue
            if (
                JSON.stringify(entry.config.modifiers ?? {}) !==
                JSON.stringify(config.modifiers ?? {})
            )
                continue
            return { id: otherId, config: entry.config }
        }
        return undefined
    }

    function cleanup() {
        const entry = shortcutRegistry.get(id)
        if (entry) {
            entry.cleanup()
            shortcutRegistry.delete(id)
        }
    }

    const cleanupListener = useEventListener(window, 'keydown', handleKeyDown)
    shortcutRegistry.set(id, {
        config: { ...config, description },
        cleanup: () => cleanupListener(),
    })

    onUnmounted(() => cleanup())

    return {
        id,
        keyString,
        disable: () => (disabledRef.value = true),
        enable: () => (disabledRef.value = false),
        isDisabled: () => unref(disabledRef) as boolean,
        destroy: cleanup,
    }
}

export function useShortcutGroup(shortcuts: ShortcutConfig[]) {
    const instances = shortcuts.map((config) => useShortcut(config))
    return {
        disableAll: () => instances.forEach((s) => s.disable()),
        enableAll: () => instances.forEach((s) => s.enable()),
        destroyAll: () => instances.forEach((s) => s.destroy()),
        instances,
    }
}

export function getRegisteredShortcuts(): Array<{
    id: string
    keyString: string
    description: string
    disabled: boolean
}> {
    const result: Array<{ id: string; keyString: string; description: string; disabled: boolean }> =
        []
    for (const [id, entry] of shortcutRegistry) {
        result.push({
            id,
            keyString: buildKeyString(entry.config),
            description: entry.config.description ?? '',
            disabled: unref(entry.config.disabled) ?? false,
        })
    }
    return result
}

export function debugShortcuts(): void {
    console.log('[useShortcut] Registered shortcuts:', getRegisteredShortcuts())
}
