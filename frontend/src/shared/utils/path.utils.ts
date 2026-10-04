export function dirname(path: string): string {
    const normalized = path.replace(/\\/g, '/').replace(/\/$/, '')
    const lastSlash = normalized.lastIndexOf('/')
    if (lastSlash === -1) return '.'
    if (lastSlash === 0) return '/'
    return normalized.substring(0, lastSlash)
}

export function basename(path: string): string {
    const normalized = path.replace(/\\/g, '/').replace(/\/$/, '')
    return normalized.substring(normalized.lastIndexOf('/') + 1)
}

export function extname(path: string): string {
    const base = basename(path)
    const dotIndex = base.lastIndexOf('.')
    if (dotIndex <= 0) return ''
    return base.substring(dotIndex)
}

export function isDescendantOf(childPath: string, parentPath: string): boolean {
    if (parentPath === '.') return true
    return childPath.startsWith(parentPath + '/')
}
