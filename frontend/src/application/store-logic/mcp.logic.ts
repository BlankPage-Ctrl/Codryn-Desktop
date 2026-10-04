import type { FEMcpServer } from '@/core/entities'
import type { McpStorer } from '../stores/mcp.storer'

export interface McpStoreLogic {
    selectWorkspace(id: string | null): void
    beginLoad(): void
    endLoad(servers: FEMcpServer[], source: string): void
    setError(message: string | null): void
    beginToggle(name: string): void
    endToggle(server: FEMcpServer): void
    failToggle(name: string): void
}

export function createMcpStoreLogic(getStorer: () => McpStorer): McpStoreLogic {
    return {
        selectWorkspace: (id) => getStorer().selectWorkspace(id),
        beginLoad: () => {
            getStorer().loading = true
            getStorer().error = null
        },
        endLoad: (servers, source) => {
            const storer = getStorer()
            storer.loading = false
            storer.servers = servers
            storer.source = source
        },
        setError: (message) => {
            getStorer().error = message
        },
        beginToggle: (name) => {
            getStorer().toggling = { ...getStorer().toggling, [name]: true }
        },
        endToggle: (server) => {
            const storer = getStorer()
            const { [server.name]: _dropped, ...rest } = storer.toggling
            storer.toggling = rest
            storer.servers = storer.servers.map((s) => (s.name === server.name ? server : s))
        },
        failToggle: (name) => {
            const storer = getStorer()
            const { [name]: _dropped, ...rest } = storer.toggling
            storer.toggling = rest
        },
    }
}
