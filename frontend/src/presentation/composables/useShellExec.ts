import { watch, onUnmounted, type Ref } from 'vue'
import { shellExec } from '@/data/stream'
import { useShellExecStorer } from '@/application/stores'
import { createShellExecStoreLogic } from '@/application/store-logic'

export function useShellExec(workspaceId: Ref<string> | (() => string)) {
    const storer = useShellExecStorer()
    const logic = createShellExecStoreLogic(() => storer)

    let stop: (() => void) | null = null

    function stopCurrent(): void {
        stop?.()
        stop = null
        storer.clear()
    }

    function start(id: string): void {
        stopCurrent()
        if (!id) return
        stop = shellExec.watch(id, {
            onEvent: (event) => logic.apply(event),
            onError: () => {},
        })
    }

    watch(workspaceId, (id) => start(id), { immediate: true })
    onUnmounted(stopCurrent)

    return { storer, start, stop: stopCurrent }
}
