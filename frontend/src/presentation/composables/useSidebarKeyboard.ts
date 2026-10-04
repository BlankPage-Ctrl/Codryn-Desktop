import { useShortcut } from './keyboard'

export function useSidebarKeyboard(toggle: () => void) {
    useShortcut({
        key: 'b',
        modifiers: { ctrl: true },
        handler: () => toggle(),
        description: 'Toggle sidebar',
        preventDefault: true,
    })
}
