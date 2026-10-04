export function toMessage(e: unknown): string {
    return e instanceof Error ? e.message : 'An error occurred'
}
