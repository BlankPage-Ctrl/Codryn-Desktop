import type { Workspace, WorkspaceDto } from '../entities/workspace'

export interface WorkspaceRepository {
    list(): Promise<Workspace[]>
    get(id: string): Promise<Workspace>
    create(dto: WorkspaceDto): Promise<Workspace>
    update(id: string, dto: Partial<WorkspaceDto>): Promise<Workspace>
    remove(id: string): Promise<void>
}
