<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
    useFloating,
    offset as offsetMiddleware,
    flip,
    shift,
    autoUpdate,
    type Placement,
} from '@floating-ui/vue'
import type { DropdownItemConfig, DropdownMode, StyleConfig } from './types.ts'
import DropdownItem from './DropdownItem.vue'
import DropdownSeparator from './DropdownSeparator.vue'
import { filterVisible } from './utils.ts'

type Props = {
    items: DropdownItemConfig[]
    mode?: DropdownMode
    dense?: boolean
    showIcon?: boolean
    parentRef: HTMLElement | null
    close: () => void
    onItemClick: (item: DropdownItemConfig) => void
    focusedIndex?: number
    maxHeight?: number
    minWidth?: number
    level?: number
    styleConfig?: StyleConfig
}

const props = withDefaults(defineProps<Props>(), {
    mode: 'menu',
    dense: false,
    showIcon: false,
    focusedIndex: -1,
    level: 0,
})

const menuRef = ref<HTMLElement | null>(null)
const submenuRef = ref<HTMLElement | null>(null)
const hoveredItem = ref<DropdownItemConfig | null>(null)
const submenuOpen = ref(false)

const visibleItems = computed(() => filterVisible(props.items))

const itemStyle = computed(() => props.styleConfig?.item)

const menuStyle = computed(() => {
    const s: Record<string, string> = {}
    const m = props.styleConfig?.menu
    if (m?.background) s.backgroundColor = m.background
    if (m?.border) s.border = m.border
    if (m?.borderRadius) s.borderRadius = m.borderRadius
    if (m?.shadow) s.boxShadow = m.shadow
    if (m?.padding) s.padding = m.padding
    return s
})

const parentEl = computed(() => props.parentRef)

const submenuItems = computed(() => {
    if (!hoveredItem.value?.children) return []
    return hoveredItem.value.children
})

const { floatingStyles: submenuStyles } = useFloating(parentEl, submenuRef, {
    placement: 'right-start' as Placement,
    middleware: [offsetMiddleware(8), flip(), shift()],
    whileElementsMounted: autoUpdate,
    open: submenuOpen,
})

let hoverTimer: ReturnType<typeof setTimeout> | null = null

function handleItemMouseEnter(item: DropdownItemConfig) {
    if (hoverTimer) clearTimeout(hoverTimer)
    if (item.children && item.children.length > 0 && item.enabled !== false) {
        hoverTimer = setTimeout(() => {
            hoveredItem.value = item
            submenuOpen.value = true
        }, 150)
    } else {
        hoveredItem.value = null
        submenuOpen.value = false
    }
}

function handleItemClick(item: DropdownItemConfig) {
    if (item.children && item.children.length > 0) {
        return
    }
    props.onItemClick(item)
}

function handleMenuMouseLeave() {
    if (hoverTimer) clearTimeout(hoverTimer)
    hoverTimer = setTimeout(() => {
        hoveredItem.value = null
        submenuOpen.value = false
    }, 200)
}

watch(
    () => props.items,
    () => {
        submenuOpen.value = false
        hoveredItem.value = null
    },
)
</script>

<template>
    <div
        ref="menuRef"
        class="dropdown-menu"
        :class="{ 'dropdown-menu--dense': dense }"
        :style="{
            ...menuStyle,
            maxHeight: maxHeight !== undefined ? `${maxHeight}px` : undefined,
            minWidth: minWidth !== undefined ? `${minWidth}px` : undefined,
        }"
        @mouseleave="handleMenuMouseLeave"
    >
        <template v-for="item in visibleItems" :key="item.id">
            <DropdownSeparator v-if="item.type === 'separator'" />
            <div v-else-if="item.type === 'label'" class="dropdown-label">{{ item.label }}</div>
            <DropdownItem
                v-else
                :item="item"
                :dense="dense"
                :show-icon="showIcon"
                :focused="focusedIndex >= 0 && visibleItems.indexOf(item) === focusedIndex"
                :selected="!!item.selected"
                :has-submenu="
                    !!(
                        item.children &&
                        item.children.length > 0 &&
                        item.action?.type !== 'submenu'
                    ) || item.action?.type === 'submenu'
                "
                :mode="mode"
                :item-style="itemStyle"
                @click="handleItemClick"
                @mouseenter="handleItemMouseEnter"
                @right-click="onItemClick"
            />
        </template>

        <div
            v-if="submenuOpen && submenuItems.length > 0"
            ref="submenuRef"
            :style="submenuStyles"
            class="dropdown-menu--submenu"
        >
            <DropdownMenu
                :items="submenuItems"
                :mode="mode"
                :dense="dense"
                :show-icon="showIcon"
                :parent-ref="menuRef"
                :close="close"
                :on-item-click="onItemClick"
                :focused-index="-1"
                :level="level + 1"
                :min-width="minWidth"
                :style-config="styleConfig"
            />
        </div>
    </div>
</template>

<style scoped>
.dropdown-menu {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 4px;
    max-height: 400px;
    overflow-y: auto;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    box-shadow:
        0 2px 5px rgba(15, 15, 20, 0.08),
        0 4px 5px rgba(15, 15, 20, 0.06);
}

.dropdown-menu--dense {
    max-height: 320px;
}

.dropdown-menu--submenu {
    z-index: 10;
}

.dropdown-menu::-webkit-scrollbar {
    width: 4px;
}

.dropdown-menu::-webkit-scrollbar-track {
    background: transparent;
}

.dropdown-menu::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
}

.dropdown-menu::-webkit-scrollbar-thumb:hover {
    background: var(--border-color);
}

.dropdown-label {
    padding: 5px 10px 3px;
    font-size: var(--type-2xs);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: default;
    user-select: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
