export const TOOL_TITLE_PATH_MAX = 48
export const TOOL_TITLE_COMMAND_MAX = 60

function asRecord(value: unknown): Record<string, unknown> | null {
    if (value === null || value === undefined) return null
    if (typeof value !== 'object') return null
    return value as Record<string, unknown>
}

function asNonEmptyString(value: unknown): string | null {
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    return trimmed.length > 0 ? value : null
}

function normalizeSeparators(path: string): string {
    return path.replace(/\\/g, '/')
}

/**
 * Strips the workspace root prefix so titles show paths relative to the
 * project (e.g. `Codryn-Desktop/frontend/src/...`). Falls back to the raw
 * path when no root matches.
 */
export function relativizePath(rawPath: string, workspaceRoot?: string): string {
    const path = normalizeSeparators(rawPath.trim())
    if (!path) return ''
    if (workspaceRoot) {
        const root = normalizeSeparators(workspaceRoot.trim()).replace(/\/+$/, '')
        if (root && (path === root || path.startsWith(root + '/'))) {
            const rel = path.slice(root.length).replace(/^\/+/, '')
            return rel || path
        }
    }
    return path
}

/**
 * Truncates a long path by dropping head segments, keeping the tail
 * readable: `...nts/plugin/components/RegisterForm.vue`.
 * Cuts on a `/` boundary so folder names stay intact when possible.
 */
export function truncateHead(path: string, max = TOOL_TITLE_PATH_MAX): string {
    if (path.length <= max) return path
    const keep = max - 3
    let tail = path.slice(path.length - keep)
    const slash = tail.indexOf('/')
    if (slash >= 0 && slash < keep - 1) tail = tail.slice(slash + 1)
    return `...${tail}`
}

/** Splits `dir/file.ext` into directory and file name. */
export function splitDirFile(relativePath: string): { dir: string; file: string } {
    const normalized = normalizeSeparators(relativePath)
    const slash = normalized.lastIndexOf('/')
    if (slash < 0) return { dir: '', file: normalized }
    return {
        dir: normalized.slice(0, slash),
        file: normalized.slice(slash + 1),
    }
}

/** Truncates a shell command on the tail: `npm run ...`. */
export function truncateCommand(command: string, max = TOOL_TITLE_COMMAND_MAX): string {
    const collapsed = command.replace(/\s+/g, ' ').trim()
    if (collapsed.length <= max) return collapsed
    return `${collapsed.slice(0, max - 3).trimEnd()}...`
}

export interface DiffLineCounts {
    added: number
    removed: number
}

/**
 * Counts added/removed lines from a unified diff string.
 * Skips diff headers (`---`, `+++`, `@@`).
 */
export function countDiffLines(diff: string): DiffLineCounts {
    let added = 0
    let removed = 0
    for (const line of diff.split('\n')) {
        if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
        if (line.startsWith('+')) added++
        else if (line.startsWith('-')) removed++
    }
    return { added, removed }
}

/** Line count of a file content string (empty content is 0 lines). */
export function countContentLines(content: string): number {
    if (content === '') return 0
    return content.split('\n').length
}

function toPositiveInt(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null
    const n = Math.trunc(value)
    return n > 0 ? n : null
}

export interface ReadWindow {
    limit?: number
    /** 1-indexed first line, when an offset/startLine is known. */
    from?: number
    /** 1-indexed last line, when the window end is known. */
    to?: number
}

/**
 * Reads the paging params of a read_file input object.
 * Supports `offset`/`limit` (1-indexed) and the legacy
 * `startLine`/`endLine` pair.
 */
export function parseReadWindow(input: unknown): ReadWindow {
    const record = asRecord(input)
    if (!record) return {}
    const offset = toPositiveInt(record.offset ?? record.startLine)
    const limit = toPositiveInt(record.limit)
    const endLine = toPositiveInt(record.endLine)
    if (offset != null && limit != null) {
        return { from: offset, to: offset + limit - 1 }
    }
    if (offset != null && endLine != null && endLine >= offset) {
        return { from: offset, to: endLine }
    }
    if (offset != null) return { from: offset }
    if (limit != null) return { limit }
    if (endLine != null) return { to: endLine }
    return {}
}

/** Formats a parsed read window as short `key: value` chips. */
export function formatReadWindow(window: ReadWindow): string[] {
    if (window.from != null && window.to != null) {
        return [`from ${window.from} to ${window.to}`]
    }
    if (window.from != null) return [`from: ${window.from}`]
    if (window.limit != null) return [`limit: ${window.limit}`]
    if (window.to != null) return [`to: ${window.to}`]
    return []
}

/** Extracts the file path from a tool input object (`path` field). */
export function inputPath(input: unknown): string | null {
    const record = asRecord(input)
    if (!record) return null
    return asNonEmptyString(record.path)
}

export function inputCommand(input: unknown): string | null {
    const record = asRecord(input)
    if (!record) return null
    return asNonEmptyString(record.command)
}

export function inputOverwrite(input: unknown): boolean {
    const record = asRecord(input)
    if (!record) return false
    return record.overwrite === true
}
