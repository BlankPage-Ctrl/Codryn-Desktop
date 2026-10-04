import type { DropdownItemConfig } from './types'

export function flattenTree<T = string>(items: DropdownItemConfig<T>[]): DropdownItemConfig<T>[] {
    const result: DropdownItemConfig<T>[] = []
    function walk(list: DropdownItemConfig<T>[]) {
        for (const item of list) {
            if (item.type === 'separator' || item.type === 'label') continue
            if (item.visible === false) continue
            result.push(item)
            if (item.children && item.children.length > 0) {
                walk(item.children)
            }
        }
    }
    walk(items)
    return result
}

export function filterVisible<T = string>(items: DropdownItemConfig<T>[]): DropdownItemConfig<T>[] {
    return items.filter((item) => item.visible !== false)
}

export function findItemById<T = string>(
    items: DropdownItemConfig<T>[],
    id: string,
): DropdownItemConfig<T> | undefined {
    for (const item of items) {
        if (item.id === id) return item
        if (item.children) {
            const found = findItemById(item.children, id)
            if (found) return found
        }
    }
    return undefined
}

export function getSelectableItems<T = string>(
    items: DropdownItemConfig<T>[],
): DropdownItemConfig<T>[] {
    const result: DropdownItemConfig<T>[] = []
    function walk(list: DropdownItemConfig<T>[]) {
        for (const item of list) {
            if (item.type === 'separator' || item.type === 'label') continue
            if (item.visible === false) continue
            if (item.action?.type === 'submenu') continue
            if (item.enabled === false) continue
            result.push(item)
        }
    }
    walk(items)
    return result
}
