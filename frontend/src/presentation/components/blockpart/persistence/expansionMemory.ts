import type { BlockPartViewMode } from '../types/schema'

interface BlockPartExpansionMemory {
    expanded: Map<string, boolean>
    viewMode: Map<string, BlockPartViewMode>
}

const memory: BlockPartExpansionMemory = {
    expanded: new Map(),
    viewMode: new Map(),
}

export function getBlockPartExpansionMemory(): BlockPartExpansionMemory {
    return memory
}

export function clearBlockPartExpansionMemory(): void {
    memory.expanded.clear()
    memory.viewMode.clear()
}
