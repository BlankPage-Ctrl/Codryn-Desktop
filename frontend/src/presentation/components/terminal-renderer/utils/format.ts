export function formatDuration(ms: number | null | undefined): string | null {
    if (ms == null) return null
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
    return `${(ms / 60000).toFixed(1)}m`
}

export function formatExitBadge(
    exitCode: number | null,
    timedOut: boolean,
    signal: string | null,
): { label: string; kind: 'ok' | 'err' | 'warn' } | null {
    if (timedOut) return { label: 'timed out', kind: 'warn' }
    if (signal) return { label: `signal ${signal}`, kind: 'err' }
    if (exitCode == null) return null
    if (exitCode === 0) return { label: 'exit 0', kind: 'ok' }
    return { label: `exit ${exitCode}`, kind: 'err' }
}

export function shortCwd(cwd: string): string {
    if (!cwd) return ''
    const parts = cwd.split('/')
    if (parts.length > 3) return '…/' + parts.slice(-2).join('/')
    return cwd
}
