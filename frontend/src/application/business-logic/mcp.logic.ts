import type { FEMcpList, FEMcpServer } from '@/core/entities'
import type { McpRepository } from '@/core/repositories'

export interface McpBusinessLogicDeps {
    repo: McpRepository
}

export interface McpBusinessLogic {
    list(workspaceId: string): Promise<FEMcpList>
    setEnabled(workspaceId: string, name: string, enabled: boolean): Promise<FEMcpServer>
}

export function createMcpBusinessLogic(deps: McpBusinessLogicDeps): McpBusinessLogic {
    return {
        list: (workspaceId) => deps.repo.listServers(workspaceId),
        setEnabled: (workspaceId, name, enabled) =>
            deps.repo.setEnabled(workspaceId, name, enabled),
    }
}
