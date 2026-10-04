import { ref, readonly, type Ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import type { ContainerSchema, ContainerResizeMode, SizeValue } from '../types'

export function useColumnResize(options: {
    rows: Ref<ReadonlyArray<ContainerSchema>>
    defaultMinWidth?: number
    defaultMaxWidth?: number
}) {
    const { rows, defaultMinWidth = 80, defaultMaxWidth = 600 } = options

    const isResizing = ref(false)
    const overriddenWidths = ref(new Map<string, number>())

    let startX = 0
    let startColWidth = 0
    let nextColWidth = 0
    let activeNextColId: string | null = null
    let activeMode: ContainerResizeMode = 'edge'
    let activeMin = 0
    let activeMax = 0
    let activeNextMin = 0
    let activeNextMax = 0

    function getRenderedColumnWidths(rowId: string): number[] {
        const rowEl = document.querySelector(`[data-row="${rowId}"]`)
        if (!rowEl) return []
        const children = rowEl.children
        const widths: number[] = []
        for (let i = 0; i < children.length; i++) {
            widths.push((children[i] as HTMLElement).getBoundingClientRect().width)
        }
        return widths
    }

    function clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value))
    }

    function resolveWidth(colId: string, original: SizeValue): SizeValue {
        const overridden = overriddenWidths.value.get(colId)
        if (overridden !== undefined) return overridden
        return original
    }

    function onHandleMouseDown(
        e: MouseEvent,
        rowId: string,
        colId: string,
        resizeMode: ContainerResizeMode,
    ) {
        e.preventDefault()
        e.stopPropagation()

        const row = rows.value.find((r) => r.id === rowId)
        if (!row) return

        const visibleCols = row.columns.filter((c) => c.visible !== false)
        const visibleIdx = visibleCols.findIndex((c) => c.id === colId)
        if (visibleIdx === -1) return

        isResizing.value = true
        activeMode = resizeMode
        startX = e.clientX

        const renderedWidths = getRenderedColumnWidths(rowId)
        startColWidth = renderedWidths[visibleIdx] ?? 100

        const col = visibleCols[visibleIdx]
        if (!col) return
        activeMin = col.minWidth ?? defaultMinWidth
        activeMax = col.maxWidth ?? defaultMaxWidth

        activeNextColId = null
        activeNextMin = 0
        activeNextMax = 0
        nextColWidth = 0

        if (resizeMode === 'split' && visibleIdx < visibleCols.length - 1) {
            const nextCol = visibleCols[visibleIdx + 1]
            if (nextCol) {
                activeNextColId = nextCol.id
                nextColWidth = renderedWidths[visibleIdx + 1] ?? 100
                activeNextMin = nextCol.minWidth ?? defaultMinWidth
                activeNextMax = nextCol.maxWidth ?? defaultMaxWidth
            }
        }

        const handleMouseMove = (ev: MouseEvent) => {
            const delta = ev.clientX - startX
            const map = new Map(overriddenWidths.value)

            if (activeMode === 'edge') {
                map.set(colId, Math.round(clamp(startColWidth + delta, activeMin, activeMax)))
            } else if (activeMode === 'split' && activeNextColId) {
                map.set(colId, Math.round(clamp(startColWidth + delta, activeMin, activeMax)))
                map.set(
                    activeNextColId,
                    Math.round(clamp(nextColWidth - delta, activeNextMin, activeNextMax)),
                )
            }

            overriddenWidths.value = map
        }

        const handleMouseUp = () => {
            isResizing.value = false
            cleanupMove()
        }

        const cleanupMove = useEventListener(window, 'mousemove', handleMouseMove)
        useEventListener(window, 'mouseup', handleMouseUp, { once: true })
    }

    return {
        isResizing: readonly(isResizing),
        onHandleMouseDown,
        resolveWidth,
    }
}
