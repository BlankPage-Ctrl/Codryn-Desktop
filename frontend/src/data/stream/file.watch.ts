import { StartWatch, StopWatch } from '../../../wailsjs/go/stream/FileWatchService'
import { EventsOn, EventsOff } from '../../../wailsjs/runtime'
import type { FEFileNode, FEWatchEvent } from '@/core/entities'
import type { FileWatchPort } from '@/core/repositories'

interface BackendFileNode {
    id: string
    name: string
    path: string
    type: string
    isDirectory: boolean
    size?: number
    lastModified?: number
    hasChildren?: boolean
    children?: BackendFileNode[]
    meta?: {
        isSymlink?: boolean
        symlinkTarget?: string
    }
}

interface BackendWatchEvent {
    type: string
    node: BackendFileNode
    oldPath?: string
    timestamp: number
}

function toFEWatchEvent(event: BackendWatchEvent): FEWatchEvent {
    return {
        type: event.type as FEWatchEvent['type'],
        node: toFEFileNode(event.node),
        oldPath: event.oldPath,
        timestamp: event.timestamp,
    }
}

function toFEFileNode(n: BackendFileNode): FEFileNode {
    return {
        id: n.id,
        name: n.name,
        path: n.path,
        type: n.type.toLowerCase() as FEFileNode['type'],
        isDirectory: n.isDirectory,
        size: n.size,
        lastModified: n.lastModified,
        hasChildren: n.hasChildren,
        children: n.children?.map((c) => c.path),
        symlink: n.meta?.symlinkTarget ? { target: n.meta.symlinkTarget } : undefined,
    }
}

export const fileWatch: FileWatchPort = {
    createWatchConnection: (
        workspaceId: string,
        onEvent: (event: FEWatchEvent) => void,
        onError?: (error: Event) => void,
    ): (() => void) => {
        let streamId: string | null = null
        let active = true
        let cleanup: (() => void)[] = []

        const handleEvent = (sid: string, raw: string) => {
            if (!active || sid !== streamId) return
            try {
                const parsed = JSON.parse(raw)
                onEvent(toFEWatchEvent(parsed))
            } catch {
                /* skip malformed */
            }
        }

        const handleError = (sid: string, errMsg: string) => {
            if (!active || sid !== streamId) return
            console.error('[FileExplorer] watch error:', errMsg)
            onError?.(new Event('error'))
        }

        cleanup = [
            EventsOn('file:watch-event', handleEvent),
            EventsOn('file:watch-error', handleError),
        ]

        StartWatch(workspaceId).then((id) => {
            if (!active) {
                StopWatch(id)
                return
            }
            streamId = id
        })

        return () => {
            active = false
            cleanup.forEach((fn) => fn())
            EventsOff('file:watch-event')
            EventsOff('file:watch-error')
            if (streamId) StopWatch(streamId)
        }
    },
}
