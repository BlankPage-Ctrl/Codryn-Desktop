import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router/index.ts'

if (typeof window !== 'undefined' && !(window as unknown as { runtime?: unknown }).runtime) {
    const noop = () => () => {}
    ;(window as unknown as Record<string, unknown>).runtime = {
        EventsOnMultiple: noop,
        EventsOn: noop,
        EventsOff: () => {},
        EventsOffAll: () => {},
        EventsOnce: noop,
        EventsEmit: () => {},
        LogPrint: () => {},
        LogTrace: () => {},
        LogDebug: () => {},
        LogInfo: () => {},
        LogWarning: () => {},
        LogError: () => {},
        LogFatal: () => {},
    } as unknown as never
    console.warn(
        '[wails] window.runtime missing at startup — injected mock to prevent blank crash (will be overwritten when Wails reloads)',
    )
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
