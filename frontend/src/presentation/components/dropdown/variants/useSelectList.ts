import { ref, computed } from 'vue'
import type { DropdownItemConfig } from '../types'

export function useSelectList(items: DropdownItemConfig<string>[], initialValue: string | null) {
    const selectedValue = ref<string | null>(initialValue)

    const itemsWithSelection = computed<DropdownItemConfig<string>[]>(() =>
        items.map((item) => ({
            ...item,
            selected: item.value != null && item.value === selectedValue.value,
            children: item.children
                ? item.children.map((child) => ({
                      ...child,
                      selected: child.value != null && child.value === selectedValue.value,
                  }))
                : undefined,
        })),
    )

    function select(value: string) {
        selectedValue.value = value
    }

    return {
        selectedValue,
        itemsWithSelection,
        select,
    }
}
