import { ref, watch, nextTick } from 'vue'

export function useTerminalScroll(getEl: () => HTMLElement | null) {
    const autoScroll = ref(true)

    function scrollToBottom() {
        const el = getEl()
        if (!el || !autoScroll.value) return
        nextTick(() => {
            const cur = getEl()
            if (cur) cur.scrollTop = cur.scrollHeight
        })
    }

    function onScroll() {
        const el = getEl()
        if (!el) return
        const threshold = 64
        autoScroll.value = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    }

    function bindLengthWatcher(length: () => number) {
        watch(length, () => scrollToBottom(), { flush: 'post' })
    }

    return { autoScroll, scrollToBottom, onScroll, bindLengthWatcher }
}
