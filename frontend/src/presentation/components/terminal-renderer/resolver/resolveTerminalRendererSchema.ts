import type {
    TerminalRendererSchema,
    ResolvedTerminalRendererSchema,
    TerminalRendererStatus,
} from '../types/schema'

export interface ResolveTerminalDefaults {
    isDark?: boolean
    fontSize?: number
    lineHeight?: number
    animated?: boolean
}

export function resolveTerminalRendererSchema(
    schema: TerminalRendererSchema,
    defaults: ResolveTerminalDefaults = {},
): ResolvedTerminalRendererSchema {
    const status: TerminalRendererStatus =
        schema.status ?? (schema.lines?.length ? 'running' : 'done')
    return {
        command: schema.command,
        cwd: schema.cwd,
        lines: schema.lines ?? [],
        stdout: schema.stdout,
        stderr: schema.stderr,
        stdoutAnsi: schema.stdoutAnsi,
        stderrAnsi: schema.stderrAnsi,
        exitCode: schema.exitCode ?? null,
        durationMs: schema.durationMs ?? null,
        timedOut: schema.timedOut ?? false,
        signal: schema.signal ?? null,
        truncated: schema.truncated ?? false,
        spillPath: schema.spillPath ?? null,
        status,
        animated: schema.animated ?? defaults.animated ?? true,
        isDark: schema.isDark ?? defaults.isDark ?? false,
        variant: schema.variant ?? 'compact',
        fontSize: schema.fontSize ?? defaults.fontSize ?? 12,
        lineHeight: schema.lineHeight ?? defaults.lineHeight ?? 1.5,
    }
}
