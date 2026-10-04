import type { SettingsValue, DefaultProvider } from '../entities/settings'

export interface SettingsRepository {
    getValue(key: string): Promise<SettingsValue>
    setValue(key: string, value: string): Promise<SettingsValue>
    getDefaultProvider(): Promise<DefaultProvider>
    setDefaultProvider(providerId: string, modelId: string): Promise<DefaultProvider>
}
