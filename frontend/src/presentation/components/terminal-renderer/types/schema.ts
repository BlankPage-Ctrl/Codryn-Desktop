import type { ShellExecLine } from '@/core/entities'

export type TerminalRendererStatus = 'running' | 'done' | 'error' | 'idle'

export type TerminalRendererVariant = 'compact' | 'full'

export interface TerminalRendererSchema {
    readonly command: string
    readonly cwd: string
    readonly lines?: ShellExecLine[]
    readonly stdout: string
    readonly stderr: string
    readonly stdoutAnsi: string
    readonly stderrAnsi: string
    readonly exitCode?: number | null
    readonly durationMs?: number | null
    readonly timedOut?: boolean
    readonly signal?: string | null
    readonly truncated?: boolean
    readonly spillPath?: string | null
    readonly status?: TerminalRendererStatus
    readonly animated?: boolean
    readonly isDark?: boolean
    readonly variant?: TerminalRendererVariant
    readonly fontSize?: number
    readonly lineHeight?: number
}

export interface ResolvedTerminalRendererSchema {
    readonly command: string
    readonly cwd: string
    readonly lines: ShellExecLine[]
    readonly stdout: string
    readonly stderr: string
    readonly stdoutAnsi: string
    readonly stderrAnsi: string
    readonly exitCode: number | null
    readonly durationMs: number | null
    readonly timedOut: boolean
    readonly signal: string | null
    readonly truncated: boolean
    readonly spillPath: string | null
    readonly status: TerminalRendererStatus
    readonly animated: boolean
    readonly isDark: boolean
    readonly variant: TerminalRendererVariant
    readonly fontSize: number
    readonly lineHeight: number
}
