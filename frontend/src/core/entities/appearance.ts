export interface AppearancePreset {
    label: string
    fontSize: number
}

export const APPEARANCE_PRESETS = [
    { label: 'Small', fontSize: 13 },
    { label: 'Medium', fontSize: 14 },
    { label: 'Large', fontSize: 18 },
] as const

export type AppearancePresetLabel = (typeof APPEARANCE_PRESETS)[number]['label']
