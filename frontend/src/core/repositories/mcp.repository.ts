import type { FEMcpList, FEMcpServer } from '@/core/entities'

export interface McpRepository {
    listServers(workspaceId: string): Promise<FEMcpList>
    setEnabled(workspaceId: string, name: string, enabled: boolean): Promise<FEMcpServer>
}
