import type { WorkspaceRepository } from '@/core/repositories'
import type { Workspace, WorkspaceDto } from '@/core/entities'

export interface WorkspaceBusinessLogic {
    list(): Promise<Workspace[]>
    create(dto: WorkspaceDto): Promise<Workspace>
    update(id: string, dto: Partial<WorkspaceDto>): Promise<Workspace>
    remove(id: string): Promise<void>
}

export function createWorkspaceBusinessLogic(repo: WorkspaceRepository): WorkspaceBusinessLogic {
    return {
        list: () => repo.list(),
        create: (dto) => repo.create(dto),
        update: (id, dto) => repo.update(id, dto),
        remove: (id) => repo.remove(id),
    }
}
