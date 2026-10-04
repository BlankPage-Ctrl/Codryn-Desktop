import { shallowRef, readonly, computed } from 'vue'

export function useTabs<Key, Meta = undefined>(initial: Key[] = []) {
    const order = shallowRef<Key[]>([...initial])
    const activeId = shallowRef<Key | null>(initial[0] ?? null)
    const metas = new Map<Key, Meta>()

    function isOpen(id: Key): boolean {
        return order.value.includes(id)
    }

    function open(id: Key, meta?: Meta): void {
        if (meta !== undefined) {
            metas.set(id, meta)
        }
        if (!isOpen(id)) {
            order.value.push(id)
        }
        activeId.value = id
    }

    function activate(id: Key): void {
        if (isOpen(id)) {
            activeId.value = id
        }
    }

    function close(id: Key): void {
        const index = order.value.indexOf(id)
        if (index === -1) return

        const wasActive = activeId.value === id
        order.value.splice(index, 1)
        metas.delete(id)

        if (wasActive) {
            activeId.value = order.value[index] ?? order.value[index - 1] ?? null
        }
    }

    function reset(): void {
        order.value = []
        activeId.value = null
        metas.clear()
    }

    function getMeta(id: Key): Meta | undefined {
        return metas.get(id)
    }

    const activeTab = computed<Key | null>(() => activeId.value)
    const activeMeta = computed<Meta | null>(() => {
        const id = activeId.value
        return id === null ? null : (metas.get(id) ?? null)
    })

    return {
        order: readonly(order),
        activeId,
        activeTab,
        activeMeta,
        getMeta,
        isOpen,
        open,
        activate,
        close,
        reset,
    }
}
