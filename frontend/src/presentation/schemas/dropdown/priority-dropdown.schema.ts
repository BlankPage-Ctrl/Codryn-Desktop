import type { DropdownItemConfig, DropdownProps } from '@/presentation/components/dropdown/types'
import type { Priority } from '@/core/entities'

export interface PriorityOption {
    id: Priority
    label: string
    value: Priority
}

export const PRIORITY_OPTIONS: PriorityOption[] = [
    { id: 'low', label: 'Low', value: 'low' },
    { id: 'medium', label: 'Medium', value: 'medium' },
    { id: 'high', label: 'High', value: 'high' },
    { id: 'critical', label: 'Critical', value: 'critical' },
]

export function createPriorityDropdownItems(params: {
    currentPriority: Priority
}): DropdownItemConfig[] {
    return PRIORITY_OPTIONS.map((opt) => ({
        id: opt.id,
        label: opt.label,
        value: opt.value,
        selected: opt.value === params.currentPriority,
    }))
}

export const priorityDropdownProps: Pick<
    DropdownProps,
    'mode' | 'placement' | 'width' | 'offset' | 'dense' | 'style'
> = {
    mode: 'select',
    placement: 'top',
    width: { mode: 'match-trigger', padding: 2 },
    offset: 4,
    dense: true,
    style: {
        menu: {
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '2px',
        },
        item: {
            borderRadius: '4px',
            hoverBackground: 'rgba(var(--raw-border-color), 0.3)',
            selectedBackground: 'rgba(var(--raw-border-color), 0.3)',
        },
    },
}

export const PRIORITY_TRIGGER_LABELS: Record<Priority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
}
