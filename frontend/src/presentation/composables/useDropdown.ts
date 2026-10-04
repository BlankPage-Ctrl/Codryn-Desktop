import { ref, computed, watch, type Ref } from 'vue'
import {
    useFloating,
    offset as offsetMiddleware,
    flip,
    shift,
    size,
    autoUpdate,
    type Placement,
} from '@floating-ui/vue'
import type {
    DropdownItemConfig,
    DropdownPlacement,
    DropdownMode,
    WidthStrategy,
    TriggerMode,
} from '../components/dropdown/types'
import { getSelectableItems } from '../components/dropdown/utils'
import { useEventListener } from '@vueuse/core'

export function useDropdown<T = string>(options: {
    isOpen: Ref<boolean>
    triggerRef: Ref<HTMLElement | null>
    menuRef: Ref<HTMLElement | null>
    items: Ref<DropdownItemConfig<T>[]>
    placement: Ref<DropdownPlacement>
    mode: Ref<DropdownMode>
    width: Ref<WidthStrategy>
    offset: Ref<number>
    triggerMode: Ref<TriggerMode>
}) {
    const {
        isOpen,
        triggerRef,
        menuRef,
        items,
        placement: dropdownPlacement,
        width,
        offset: offsetVal,
    } = options

    const floatingPlacement = computed<Placement>(() =>
        dropdownPlacement.value === 'top' ? 'top-start' : 'bottom-start',
    )

    const selectableItems = computed(() => getSelectableItems(items.value))

    const focusedIndex = ref(-1)

    const floatingMiddleware = computed(() => {
        const mw = [
            offsetMiddleware(offsetVal.value),
            flip({
                fallbackPlacements:
                    dropdownPlacement.value === 'top'
                        ? ['bottom-start', 'top-start']
                        : ['top-start', 'bottom-start'],
            }),
            shift(),
        ]

        if (width.value.mode === 'match-trigger') {
            const padding = width.value.padding ?? 0
            mw.push(
                size({
                    apply({ availableWidth, elements }) {
                        Object.assign(elements.floating.style, {
                            width: `${elements.reference ? (elements.reference as HTMLElement).offsetWidth - padding : 'auto'}px`,
                            maxWidth: `${Math.min(availableWidth, 400)}px`,
                        })
                    },
                }),
            )
        }

        return mw
    })

    const {
        floatingStyles,
        placement: resolvedPlacement,
        isPositioned,
        update,
    } = useFloating(triggerRef, menuRef, {
        placement: floatingPlacement,
        middleware: floatingMiddleware,
        whileElementsMounted: autoUpdate,
        open: isOpen,
    })

    function focusNext() {
        const list = selectableItems.value
        if (list.length === 0) return
        focusedIndex.value = (focusedIndex.value + 1) % list.length
    }

    function focusPrev() {
        const list = selectableItems.value
        if (list.length === 0) return
        focusedIndex.value = (focusedIndex.value - 1 + list.length) % list.length
    }

    function selectFocused() {
        const list = selectableItems.value
        if (list.length === 0 || focusedIndex.value < 0) return
        const item = list[focusedIndex.value]
        if (!item) return
        return item
    }

    function focusFirst() {
        if (selectableItems.value.length > 0) {
            focusedIndex.value = 0
        }
    }

    function focusLast() {
        const list = selectableItems.value
        if (list.length > 0) {
            focusedIndex.value = list.length - 1
        }
    }

    function resetFocus() {
        focusedIndex.value = -1
    }

    watch(isOpen, (open) => {
        if (open) {
            focusedIndex.value = -1
            requestAnimationFrame(() => update())
        }
    })

    function handleKeydown(e: KeyboardEvent) {
        if (!isOpen.value) return
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                focusNext()
                break
            case 'ArrowUp':
                e.preventDefault()
                focusPrev()
                break
            case 'Enter':
            case ' ':
                e.preventDefault()
                selectFocused()
                break
            case 'Escape':
                e.preventDefault()
                isOpen.value = false
                break
            case 'Home':
                e.preventDefault()
                focusFirst()
                break
            case 'End':
                e.preventDefault()
                focusLast()
                break
        }
    }

    let cleanupKeydown: (() => void) | null = null
    watch(isOpen, (open) => {
        if (open) {
            const stop = useEventListener(document, 'keydown', handleKeydown)
            cleanupKeydown = () => stop()
        } else {
            cleanupKeydown?.()
            cleanupKeydown = null
        }
    })

    function handleClickOutside(e: MouseEvent) {
        if (!isOpen.value) return
        const target = e.target as Node
        if (!target) return
        if (triggerRef.value?.contains(target)) return
        if (menuRef.value?.contains(target)) return
        isOpen.value = false
    }

    let cleanupClickOutside: (() => void) | null = null
    watch(isOpen, (open) => {
        if (open) {
            document.addEventListener('mousedown', handleClickOutside)
            cleanupClickOutside = () => {
                document.removeEventListener('mousedown', handleClickOutside)
            }
        } else {
            cleanupClickOutside?.()
            cleanupClickOutside = null
        }
    })

    return {
        floatingStyles,
        resolvedPlacement,
        isPositioned,
        focusedIndex,
        focusedIndexRef: focusedIndex,
        selectFocused,
        focusNext,
        focusPrev,
        focusFirst,
        focusLast,
        resetFocus,
        handleKeydown,
        update,
        selectableItems,
    }
}
