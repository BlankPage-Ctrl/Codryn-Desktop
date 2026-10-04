import { reactive } from 'vue'

export const settingsTab = reactive({
    requestCount: 0,
    requestOpen() {
        this.requestCount++
    },
})

export function useSettingsTab() {
    return settingsTab
}
