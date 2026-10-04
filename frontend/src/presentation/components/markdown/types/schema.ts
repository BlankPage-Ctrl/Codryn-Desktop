import type { Component } from 'vue'

export type RendererRegistry = Record<string, Component | undefined>

export interface MarkdownCodeSchema {
    theme?: {
        light?: string
        dark?: string
    }
}

export interface MarkdownSchema {
    text: string
    state?: 'streaming' | 'done'
    isDark?: boolean
    fontSize?: number
    lineHeight?: number
    code?: MarkdownCodeSchema
    renderers?: Partial<RendererRegistry>
}

export interface ResolvedMarkdownSchema {
    text: string
    mode: 'streaming' | 'static'
    isDark: boolean
    fontSize: number
    lineHeight: number
    code: {
        theme: {
            light?: string
            dark?: string
        }
    }
    renderers: RendererRegistry
}
