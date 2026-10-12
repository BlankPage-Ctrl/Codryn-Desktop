import { reactive } from 'vue'

export const pluginsTab = reactive({
    requestCount: 0,
    requestOpen() {
        this.requestCount++
    },
})

export function usePluginsTab() {
    return pluginsTab
}
