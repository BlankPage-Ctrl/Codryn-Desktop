export interface WorkspaceDto {
    name: string
    description?: string
    projectPath: string
}

export interface Workspace {
    id: string
    name: string
    description?: string
    projectPath: string
    createdAt: string
    updatedAt: string
}
