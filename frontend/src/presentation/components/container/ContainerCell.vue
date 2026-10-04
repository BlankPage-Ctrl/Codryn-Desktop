<script setup lang="ts">
import { computed } from 'vue'
import ResizeHandle from './components/ResizeHandle.vue'
import type { ContainerCellStyle, ContainerResizeMode, SizeValue } from './types/index.ts'

type Props = {
    readonly cellId: string
    readonly rowId?: string
    readonly styleConfig?: ContainerCellStyle
    readonly animate?: boolean
    readonly animationMs?: number
    readonly resizable?: boolean
    readonly resizeMode?: ContainerResizeMode
}

const props = withDefaults(defineProps<Props>(), {
    rowId: undefined,
    styleConfig: undefined,
    animate: false,
    animationMs: 180,
    resizable: false,
    resizeMode: 'edge',
})

const emit = defineEmits<{
    resizeGrab: [event: MouseEvent]
}>()

const toCssSize = (value?: SizeValue): string | undefined => {
    if (value === undefined) return undefined
    return typeof value === 'number' ? `${value}px` : value
}

const cellStyle = computed(() => {
    const style = props.styleConfig

    return {
        padding: toCssSize(style?.padding),
        margin: toCssSize(style?.margin),
        borderColor: style?.borderColor,
        borderWidth: toCssSize(style?.borderWidth),
        borderStyle: style?.borderStyle,
        borderRadius: toCssSize(style?.radius),
        background: style?.background,
        overflow: style?.overflow ?? 'auto',
        overflowX: style?.overflowX,
        overflowY: style?.overflowY,
        transition: props.animate ? `all ${props.animationMs}ms ease` : undefined,
    }
})
</script>

<template>
    <div class="container-cell" :data-cell="cellId" :style="cellStyle">
        <slot />
        <ResizeHandle v-if="resizable" :mode="resizeMode" @grab="emit('resizeGrab', $event)" />
    </div>
</template>

<style scoped>
.container-cell {
    position: relative;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;
}
</style>
