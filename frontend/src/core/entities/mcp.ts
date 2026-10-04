export type FEMcpServerStatus = 'ready' | 'error' | 'disabled'

export interface FEMcpServer {
    name: string
    transport: string
    enabled: boolean
    status: FEMcpServerStatus
    tools: number
    error: string | null
}

export interface FEMcpList {
    workspaceId: string
    source: string
    servers: FEMcpServer[]
}
