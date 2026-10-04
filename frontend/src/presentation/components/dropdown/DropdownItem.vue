<script setup lang="ts">
import { computed } from 'vue'
import { Check, NavArrowRight } from '@iconoir/vue'
import type { DropdownItemConfig, DropdownMode, ItemStyle } from './types'

defineOptions({ inheritAttrs: false })

type Props = {
    item: DropdownItemConfig
    dense?: boolean
    focused?: boolean
    selected?: boolean
    hasSubmenu?: boolean
    mode?: DropdownMode
    showIcon?: boolean
    itemStyle?: ItemStyle
}

const props = withDefaults(defineProps<Props>(), {
    dense: false,
    focused: false,
    selected: false,
    hasSubmenu: false,
    mode: 'menu',
    showIcon: false,
})

const emit = defineEmits<{
    (e: 'click', item: DropdownItemConfig): void
    (e: 'mouseenter', item: DropdownItemConfig): void
    (e: 'right-click', item: DropdownItemConfig): void
}>()

const itemAttrsStyle = computed(() => {
    if (!props.itemStyle) return undefined
    const s: Record<string, string> = {}
    const is = props.itemStyle
    if (is.padding) s.padding = is.padding
    if (is.fontSize) s.fontSize = is.fontSize
    if (is.color) s.color = is.color
    if (is.borderRadius) s.borderRadius = is.borderRadius
    if (is.disabledOpacity !== undefined)
        s['--dropdown-item-disabled-opacity'] = String(is.disabledOpacity)
    if (is.hoverBackground) s['--dropdown-item-hover-bg'] = is.hoverBackground
    if (is.focusedBackground) s['--dropdown-item-focused-bg'] = is.focusedBackground
    if (is.selectedBackground) s['--dropdown-item-selected-bg'] = is.selectedBackground
    return Object.keys(s).length > 0 ? s : undefined
})

const showIconArea = computed(() => {
    if (!props.showIcon) return false
    return !!(
        props.item.icon ||
        props.mode === 'select' ||
        props.mode === 'multi-select' ||
        props.selected
    )
})
</script>

<template>
    <div
        class="dropdown-item"
        :class="{
            'dropdown-item--focused': focused,
            'dropdown-item--danger': item.danger,
            'dropdown-item--disabled': item.enabled === false,
            'dropdown-item--selected': selected,
            'dropdown-item--dense': dense,
            'dropdown-item--has-submenu': hasSubmenu,
        }"
        :style="itemAttrsStyle"
        :title="item.title ?? item.label"
        role="menuitem"
        :aria-disabled="item.enabled === false"
        @click="item.enabled !== false && emit('click', item)"
        @mouseenter="emit('mouseenter', item)"
    >
        <div v-if="showIconArea" class="dropdown-item__icon">
            <component :is="item.icon" v-if="item.icon" class="dropdown-item__svg" />
            <Check
                v-else-if="selected"
                class="dropdown-item__check"
                width="14"
                height="14"
                stroke-width="2.5"
            />
        </div>

        <span class="dropdown-item__label">{{ item.label }}</span>

        <div
            v-if="item.rightIcon"
            class="dropdown-item__right-icon"
            @click.stop="emit('right-click', item)"
        >
            <component :is="item.rightIcon" class="dropdown-item__right-svg" />
        </div>

        <span v-if="item.shortcut" class="dropdown-item__shortcut">{{ item.shortcut }}</span>

        <div v-if="hasSubmenu" class="dropdown-item__arrow">
            <NavArrowRight width="14" height="14" />
        </div>
    </div>
</template>

<style scoped>
.dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    font-size: var(--type-sm);
    color: var(--text-primary);
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    transition: background-color 80ms ease;
}

.dropdown-item--dense {
    padding: 4px 8px;
    font-size: var(--type-xs);
}

.dropdown-item--focused {
    background-color: var(--dropdown-item-focused-bg, rgba(var(--raw-border-color), 0.3));
}

.dropdown-item--danger {
    color: var(--color-danger);
}

.dropdown-item--danger.dropdown-item--focused {
    background-color: var(--color-danger, var(--dropdown-item-focused-bg));
}

.dropdown-item--disabled {
    opacity: var(--dropdown-item-disabled-opacity, 0.4);
    cursor: not-allowed;
}

.dropdown-item--selected {
    background-color: var(--dropdown-item-selected-bg, rgba(var(--raw-border-color), 0.3));
}

.dropdown-item:hover {
    background-color: var(--dropdown-item-hover-bg);
}

.dropdown-item__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
}

.dropdown-item__svg {
    width: 16px;
    height: 16px;
    color: var(--text-primary);
}

.dropdown-item--danger .dropdown-item__svg {
    color: var(--color-danger);
}

.dropdown-item__check {
    color: var(--text-primary);
}

.dropdown-item--selected .dropdown-item__check {
    color: var(--text-primary);
}

.dropdown-item__label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
}

.dropdown-item__shortcut {
    font-size: var(--type-2xs);
    color: var(--text-primary);
    margin-left: auto;
    padding-left: 12px;
    letter-spacing: 0.02em;
}

.dropdown-item__right-icon {
    display: flex;
    align-items: center;
    opacity: 0;
    transition: opacity 80ms ease;
    margin-left: auto;
    padding-left: 8px;
}

.dropdown-item:hover .dropdown-item__right-icon {
    opacity: 1;
}

.dropdown-item__right-svg {
    width: 14px;
    height: 14px;
    color: var(--color-danger);
}

.dropdown-item__right-svg:hover {
    color: var(--color-danger);
}

.dropdown-item__arrow {
    display: flex;
    align-items: center;
    color: var(--text-primary);
    margin-left: 4px;
}
</style>
