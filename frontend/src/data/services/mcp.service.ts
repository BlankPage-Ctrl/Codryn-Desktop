import { ListServers, SetEnabled } from '../../../wailsjs/go/mcp/Service'
import type { FEMcpList, FEMcpServer, FEMcpServerStatus } from '@/core/entities'
import type { McpRepository } from '@/core/repositories'

function toStatus(v: unknown): FEMcpServerStatus {
    return v === 'error' ? 'error' : v === 'disabled' ? 'disabled' : 'ready'
}

function toNumber(v: unknown): number {
    return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

function toServer(raw: unknown): FEMcpServer {
    const r = (raw ?? {}) as Record<string, unknown>
    return {
        name: typeof r.name === 'string' ? r.name : '',
        transport: typeof r.transport === 'string' ? r.transport : '',
        enabled: r.enabled !== false,
        status: toStatus(r.status),
        tools: toNumber(r.tools),
        error: typeof r.error === 'string' && r.error !== '' ? r.error : null,
    }
}

export const mcpRepository: McpRepository = {
    listServers: async (workspaceId: string): Promise<FEMcpList> => {
        const raw = (await ListServers(workspaceId)) as unknown as Record<string, unknown>
        const servers = Array.isArray(raw.servers) ? raw.servers : []
        return {
            workspaceId: typeof raw.workspaceId === 'string' ? raw.workspaceId : workspaceId,
            source: typeof raw.source === 'string' ? raw.source : '',
            servers: servers.map(toServer),
        }
    },
    setEnabled: async (
        workspaceId: string,
        name: string,
        enabled: boolean,
    ): Promise<FEMcpServer> => {
        const raw = (await SetEnabled(workspaceId, name, enabled)) as unknown as Record<
            string,
            unknown
        >
        return toServer(raw.server)
    },
}
