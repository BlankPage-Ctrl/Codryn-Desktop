<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
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
    DropdownMode,
    DropdownPlacement,
    WidthStrategy,
    TriggerMode,
    CommandAction,
    StyleConfig,
} from './types.ts'
import DropdownMenu from './DropdownMenu.vue'

defineOptions({ inheritAttrs: false })

type Props<T = string> = {
    items: DropdownItemConfig<T>[]
    modelValue?: T | T[] | null
    mode?: DropdownMode
    placement?: DropdownPlacement
    triggerMode?: TriggerMode
    width?: WidthStrategy
    maxHeight?: number
    minWidth?: number
    dense?: boolean
    disabled?: boolean
    offset?: number
    showIcon?: boolean
    block?: boolean
    style?: StyleConfig
}

const props = withDefaults(defineProps<Props>(), {
    mode: 'menu',
    placement: 'bottom',
    triggerMode: 'click',
    width: () => ({ mode: 'auto' as const }),
    dense: false,
    disabled: false,
    offset: 4,
    showIcon: false,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | string[] | null): void
    (e: 'select', value: string): void
    (e: 'action', action: CommandAction): void
    (e: 'open'): void
    (e: 'close'): void
}>()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
let closeTimer: ReturnType<typeof setTimeout> | null = null

const floatingPlacement = computed<Placement>(() =>
    props.placement === 'top' ? 'top-start' : 'bottom-start',
)

const floatingMiddleware = computed(() => {
    const mw = [
        offsetMiddleware(props.offset),
        flip({
            fallbackPlacements:
                props.placement === 'top'
                    ? ['bottom-start', 'top-start']
                    : ['top-start', 'bottom-start'],
        }),
        shift(),
    ]

    if (props.width.mode === 'match-trigger') {
        const padding = props.width.padding ?? 0
        mw.push(
            size({
                apply({ elements }) {
                    const refEl = elements.reference as HTMLElement | null
                    if (refEl) {
                        elements.floating.style.width = `${refEl.offsetWidth - padding}px`
                    }
                },
            }),
        )
    }

    return mw
})

const { floatingStyles } = useFloating(triggerRef, menuRef, {
    placement: floatingPlacement,
    middleware: floatingMiddleware,
    whileElementsMounted: autoUpdate,
    open: isOpen,
})

const computedWidth = computed(() => {
    if (props.width.mode === 'fixed') return `${props.width.width}px`
    return undefined
})

function open() {
    if (props.disabled) return
    isOpen.value = true
    emit('open')
}

function close() {
    isOpen.value = false
    emit('close')
}

function toggle() {
    if (isOpen.value) close()
    else open()
}

function handleClick() {
    if (props.triggerMode === 'click') {
        toggle()
    }
}

function handleContextMenu(e: MouseEvent) {
    if (props.triggerMode === 'contextmenu') {
        e.preventDefault()
        open()
    }
}

function handleMouseEnter() {
    if (props.triggerMode === 'hover') {
        if (closeTimer) clearTimeout(closeTimer)
        open()
    }
}

function handleMouseLeave() {
    if (props.triggerMode === 'hover') {
        closeTimer = setTimeout(() => {
            close()
        }, 250)
    }
}

function handleMenuMouseEnter() {
    if (props.triggerMode === 'hover') {
        if (closeTimer) clearTimeout(closeTimer)
    }
}

function handleMenuMouseLeave() {
    if (props.triggerMode === 'hover') {
        closeTimer = setTimeout(() => {
            close()
        }, 250)
    }
}

function handleItemClick(item: DropdownItemConfig) {
    if (item.children && item.children.length > 0) return
    if (item.enabled === false) return

    if (item.action?.type === 'command') {
        emit('action', item.action)
    }

    if (item.value !== undefined) {
        emit('select', item.value)
        if (props.mode === 'select') {
            emit('update:modelValue', item.value)
        } else if (props.mode === 'multi-select') {
            const current = (props.modelValue as string[]) || []
            const idx = current.indexOf(item.value)
            if (idx >= 0) {
                emit(
                    'update:modelValue',
                    current.filter((v) => v !== item.value),
                )
            } else {
                emit('update:modelValue', [...current, item.value])
            }
        }
    }

    if (props.mode === 'menu' || props.triggerMode === 'contextmenu') {
        close()
    }
}

function handleRightClick(item: DropdownItemConfig) {
    if (item.rightAction) {
        emit('action', item.rightAction)
    }
    close()
}

function handleKeydown(e: KeyboardEvent) {
    if (!isOpen.value) return

    switch (e.key) {
        case 'ArrowDown':
        case 'ArrowUp':
        case 'Enter':
        case ' ':
        case 'Escape':
        case 'Home':
        case 'End':
            break
        default:
            return
    }
}

onBeforeUnmount(() => {
    if (closeTimer) clearTimeout(closeTimer)
})

function handleTriggerKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggle()
    }
    if (e.key === 'ArrowDown' && !isOpen.value) {
        e.preventDefault()
        open()
    }
    if (e.key === 'Escape' && isOpen.value) {
        e.preventDefault()
        close()
    }
}
</script>

<template>
    <div
        class="dropdown-root"
        :class="{ 'dropdown-root--block': block }"
        @contextmenu="handleContextMenu"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
    >
        <div
            ref="triggerRef"
            class="dropdown-trigger"
            :class="{ 'dropdown-trigger--disabled': disabled, 'dropdown-trigger--open': isOpen }"
            role="button"
            tabindex="0"
            :aria-haspopup="true"
            :aria-expanded="isOpen"
            @click.self="handleClick"
            @keydown="handleTriggerKeydown"
        >
            <slot name="trigger" :is-open="isOpen" :toggle="toggle">
                <span class="dropdown-trigger__default" @click="toggle"
                    >{{ isOpen ? 'Close' : 'Open' }} Dropdown</span
                >
            </slot>
        </div>

        <Transition name="dropdown-fade">
            <div
                v-if="isOpen"
                ref="menuRef"
                :style="{ ...floatingStyles, width: computedWidth }"
                :class="['dropdown-floating', `dropdown-floating--${placement}`]"
                @keydown="handleKeydown"
                @click.stop
            >
                <div @mouseenter="handleMenuMouseEnter" @mouseleave="handleMenuMouseLeave">
                    <DropdownMenu
                        :items="items"
                        :mode="mode"
                        :dense="dense"
                        :show-icon="showIcon"
                        :parent-ref="menuRef"
                        :close="close"
                        :on-item-click="handleItemClick"
                        :max-height="maxHeight"
                        :min-width="minWidth"
                        :style-config="style"
                        @right-click="handleRightClick"
                    />
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.dropdown-root {
    position: relative;
    display: inline-block;
}

.dropdown-trigger {
    cursor: pointer;
}

.dropdown-trigger--disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.dropdown-root--block {
    display: block;
    width: 100%;
}

.dropdown-floating {
    z-index: 1000;
    outline: none;
}

.dropdown-fade-enter-active {
    transition:
        opacity 120ms ease,
        transform 120ms ease;
}

.dropdown-fade-leave-active {
    transition:
        opacity 80ms ease,
        transform 80ms ease;
}

.dropdown-fade-enter-from {
    opacity: 0;
    transform: translateY(-4px);
}

.dropdown-fade-leave-to {
    opacity: 0;
    transform: translateY(-2px);
}
</style>
