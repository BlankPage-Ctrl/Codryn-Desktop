import { ref, computed } from 'vue'
import type { DropdownItemConfig } from '../types'

export function useMultiSelectList(items: DropdownItemConfig<string>[], initialValues: string[]) {
    const selectedValues = ref<string[]>([...initialValues])

    const itemsWithSelection = computed<DropdownItemConfig<string>[]>(() =>
        items.map((item) => ({
            ...item,
            selected: item.value != null && selectedValues.value.includes(item.value),
            children: item.children
                ? item.children.map((child) => ({
                      ...child,
                      selected: child.value != null && selectedValues.value.includes(child.value),
                  }))
                : undefined,
        })),
    )

    function toggle(value: string) {
        const idx = selectedValues.value.indexOf(value)
        if (idx >= 0) {
            selectedValues.value = [
                ...selectedValues.value.slice(0, idx),
                ...selectedValues.value.slice(idx + 1),
            ]
        } else {
            selectedValues.value = [...selectedValues.value, value]
        }
    }

    return {
        selectedValues,
        itemsWithSelection,
        toggle,
    }
}
