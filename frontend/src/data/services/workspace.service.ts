import { List, Get, Create, Update, Delete } from '../../../wailsjs/go/workspaces/Service'
import type { Workspace, WorkspaceDto } from '@/core/entities'
import type { WorkspaceRepository } from '@/core/repositories'

export const workspacesRepository: WorkspaceRepository = {
    list: () => List() as Promise<Workspace[]>,
    get: (id: string) => Get(id) as Promise<Workspace>,
    create: (dto: WorkspaceDto) => Create(dto) as Promise<Workspace>,
    update: (id: string, dto: Partial<WorkspaceDto>) => Update(id, dto) as Promise<Workspace>,
    remove: (id: string) => Delete(id) as Promise<void>,
}
