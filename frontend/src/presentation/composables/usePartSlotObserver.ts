import { inject, provide } from 'vue'

const PartSlotObserverKey: unique symbol = Symbol('part-slot-observer')

export const PART_SLOT_BUFFER = 160

export interface PartSlotObserver {
    observe(el: HTMLElement, cb: (entry: IntersectionObserverEntry) => void): void
    unobserve(el: HTMLElement): void
    disconnect(): void
    getRoot(): HTMLElement | null
}

export function createPartSlotObserver(getRoot: () => HTMLElement | null): PartSlotObserver {
    let io: IntersectionObserver | null = null
    const callbacks = new Map<Element, (entry: IntersectionObserverEntry) => void>()

    function ensure(): IntersectionObserver {
        if (!io) {
            io = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        callbacks.get(entry.target)?.(entry)
                    }
                },
                {
                    root: getRoot(),
                    rootMargin: `${PART_SLOT_BUFFER}px 0px`,
                    threshold: 0,
                },
            )
        }
        return io
    }

    return {
        observe(el, cb) {
            callbacks.set(el, cb)
            ensure().observe(el)
        },
        unobserve(el) {
            callbacks.delete(el)
            io?.unobserve(el)
        },
        disconnect() {
            callbacks.clear()
            io?.disconnect()
            io = null
        },
        getRoot,
    }
}

export function providePartSlotObserver(observer: PartSlotObserver) {
    provide(PartSlotObserverKey, observer)
}

export function usePartSlotObserver(): PartSlotObserver {
    return inject(PartSlotObserverKey) as PartSlotObserver
}

export function isRectInView(el: HTMLElement, root: HTMLElement | null): boolean {
    if (!root) return true
    const r = el.getBoundingClientRect()
    const s = root.getBoundingClientRect()
    const top = s.top - PART_SLOT_BUFFER
    const bottom = s.bottom + PART_SLOT_BUFFER
    return r.bottom >= top && r.top <= bottom
}
