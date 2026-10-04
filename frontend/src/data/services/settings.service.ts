import {
    GetDefaultProvider,
    GetValue,
    SetDefaultProvider,
    SetValue,
} from '../../../wailsjs/go/settings/Service'
import type { DefaultProvider, SettingsValue } from '@/core/entities'
import type { SettingsRepository } from '@/core/repositories'

export const settingsRepository: SettingsRepository = {
    getValue: (key: string) => GetValue(key) as Promise<SettingsValue>,
    setValue: (key: string, value: string) => SetValue(key, value) as Promise<SettingsValue>,
    getDefaultProvider: () => GetDefaultProvider() as Promise<DefaultProvider>,
    setDefaultProvider: (providerId: string, modelId: string) =>
        SetDefaultProvider(providerId, modelId) as Promise<DefaultProvider>,
}
