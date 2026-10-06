import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router/index.ts'
import { LogError } from '../wailsjs/runtime'

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

// Production Wails builds have no devtools, so silent frontend failures
// would vanish. Bridge them to the Wails logger (visible in the terminal)
// and keep the console copy for `wails dev`. Logging never throws.
if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
        console.error('[frontend] unhandled rejection', event.reason)
        try {
            LogError(`[frontend] unhandled rejection: ${String(event.reason)}`)
        } catch {
            /* logger must never break the app */
        }
    })
    window.addEventListener('error', (event: ErrorEvent) => {
        console.error('[frontend] uncaught error', event.error ?? event.message)
        try {
            LogError(`[frontend] uncaught error: ${String(event.error ?? event.message)}`)
        } catch {
            /* logger must never break the app */
        }
    })
}

app.mount('#app')
