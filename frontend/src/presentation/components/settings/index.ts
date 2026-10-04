export { default as SettingsTab } from './SettingsTab.vue'
export { default as BaseSettingsTab } from './BaseSettingsTab.vue'

export type { SettingsTabSchema, SettingsTheme, PresetOption } from './types/schema.ts'
export type {
    ResolvedSettingsTab,
    ResolvedProviderSection,
    ResolvedAppearanceSection,
    ResolvedThemeSection,
} from './types/resolved.ts'

export { resolveSettingsTabSchema } from './resolver/resolveSettingsTabSchema.ts'
