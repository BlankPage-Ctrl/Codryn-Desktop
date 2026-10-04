import { reactive } from 'vue'
import type {
    DialogGridSchema,
    DynamicGridDataOutput,
} from '@/presentation/components/dialog/types'

export interface DialogOptions {
    title: string
    schema?: DialogGridSchema
    initialData?: DynamicGridDataOutput
    confirmLabel?: string
    cancelLabel?: string
    width?: 'sm' | 'md' | 'lg' | 'xl'
    dense?: boolean
    confirmVariant?: 'primary' | 'danger'
    closeOnBackdrop?: boolean
    message?: string
    submit?: (data: DynamicGridDataOutput) => Promise<void> | void
}

export interface DialogInstance {
    id: number
    options: Required<Pick<DialogOptions, 'title'>> & DialogOptions
    visible: boolean
    loading: boolean
    resolve: (value: DynamicGridDataOutput | false) => void
    reject: (reason?: unknown) => void
}

let nextId = 0

export const dialogs = reactive<DialogInstance[]>([])

function scheduleCleanup(id: number) {
    setTimeout(() => {
        const idx = dialogs.findIndex((d) => d.id === id)
        if (idx !== -1) {
            dialogs.splice(idx, 1)
        }
    }, 300)
}

export function useDialog() {
    function spawn(options: DialogOptions): Promise<DynamicGridDataOutput | false> {
        return new Promise((resolve, reject) => {
            const instance: DialogInstance = {
                id: ++nextId,
                options,
                visible: true,
                loading: false,
                resolve,
                reject,
            }
            dialogs.push(instance)
        })
    }

    async function confirm(
        options: Omit<DialogOptions, 'schema' | 'initialData'>,
    ): Promise<boolean> {
        const result = await spawn({
            ...options,
            schema: undefined,
            initialData: undefined,
        })
        return result !== false
    }

    return { spawn, confirm, dialogs }
}

export function submitDialog(id: number, data: DynamicGridDataOutput) {
    const instance = dialogs.find((d) => d.id === id)
    if (!instance) return

    const { submit } = instance.options

    if (submit) {
        instance.loading = true
        Promise.resolve(submit(data))
            .then(() => {
                instance.resolve(data)
                instance.visible = false
                scheduleCleanup(id)
            })
            .catch((err) => {
                instance.loading = false
                console.error('[Dialog] submit error:', err)
            })
    } else {
        instance.resolve(data)
        instance.visible = false
        scheduleCleanup(id)
    }
}

export function cancelDialog(id: number) {
    const instance = dialogs.find((d) => d.id === id)
    if (!instance) return

    instance.resolve(false)
    instance.visible = false
    scheduleCleanup(id)
}
