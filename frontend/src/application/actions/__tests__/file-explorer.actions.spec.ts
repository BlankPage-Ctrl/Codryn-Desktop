import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFileExplorerActions } from '../file-explorer.actions'
import type { FileExplorerBusinessLogic } from '../../business-logic/file-explorer.logic'
import type { FileExplorerStoreLogic } from '../../store-logic/file-explorer.logic'
import type { FEFileNode, FEWatchEvent } from '@/core/entities'

function setup() {
    const storeLogic = {
        applyWatchEvent: vi.fn<(event: FEWatchEvent) => void>(),
        reset: vi.fn<() => void>(),
        loadChildren: vi.fn<() => void>(),
        setLoadState: vi.fn<() => void>(),
        getNode: vi.fn<() => void>(),
        toggleExpand: vi.fn<() => void>(),
        selectNode: vi.fn<() => void>(),
        setSearchResults: vi.fn<() => void>(),
        getLoadState: vi.fn<() => string>(() => 'idle'),
        isExpanded: vi.fn<() => boolean>(() => false),
    } as unknown as FileExplorerStoreLogic

    const cleanupWatch = vi.fn<() => void>()
    const createWatchConnection = vi.fn<
        (
            id: string,
            onEvent: (event: FEWatchEvent) => void,
            onError?: (error: Event) => void,
        ) => () => void
    >((_id, _onEvent, _onError) => cleanupWatch)
    const businessLogic = {
        listDir: vi.fn<() => Promise<{ nodes: FEFileNode[] }>>(async () => ({ nodes: [] })),
        searchFiles: vi.fn<() => Promise<{ query: string; matches: FEFileNode[] }>>(async () => ({
            query: '',
            matches: [],
        })),
        createWatchConnection,
    } as unknown as FileExplorerBusinessLogic

    const actions = createFileExplorerActions(storeLogic, businessLogic)
    return { actions, storeLogic, businessLogic, cleanupWatch, createWatchConnection }
}

describe('file-explorer actions search', () => {
    it('clears results without calling the backend for a blank query', async () => {
        const { actions, storeLogic, businessLogic } = setup()

        await actions.searchFiles('   ')

        expect(storeLogic.setSearchResults).toHaveBeenCalledWith([])
        expect(businessLogic.searchFiles).not.toHaveBeenCalled()
    })

    it('clears results when no workspace is loaded', async () => {
        const { actions, storeLogic, businessLogic } = setup()

        await actions.searchFiles('query')

        expect(storeLogic.setSearchResults).toHaveBeenCalledWith([])
        expect(businessLogic.searchFiles).not.toHaveBeenCalled()
    })

    it('stores backend matches in the store', async () => {
        const { actions, storeLogic, businessLogic } = setup()
        await actions.loadRoot('ws-1')

        businessLogic.searchFiles = vi.fn<() => Promise<{ query: string; matches: FEFileNode[] }>>(
            async () => ({
                query: 'drop',
                matches: [
                    {
                        id: '1',
                        name: 'Dropdown.vue',
                        path: 'src/Dropdown.vue',
                        type: 'file',
                        isDirectory: false,
                    },
                ],
            }),
        ) as unknown as typeof businessLogic.searchFiles

        await actions.searchFiles('drop')

        expect(businessLogic.searchFiles).toHaveBeenCalledWith('ws-1', 'drop', undefined)
        expect(storeLogic.setSearchResults).toHaveBeenCalledWith([
            expect.objectContaining({ path: 'src/Dropdown.vue' }),
        ])
    })

    it('clears results when the backend search fails', async () => {
        const { actions, storeLogic, businessLogic } = setup()
        await actions.loadRoot('ws-1')

        businessLogic.searchFiles = vi.fn<() => Promise<{ query: string; matches: FEFileNode[] }>>(
            async () => {
                throw new Error('boom')
            },
        ) as unknown as typeof businessLogic.searchFiles

        await actions.searchFiles('drop')

        expect(storeLogic.setSearchResults).toHaveBeenCalledWith([])
    })
})

describe('file-explorer actions watch lifecycle', () => {
    beforeEach(() => {
        vi.useRealTimers()
    })

    it('startWatch creates exactly one connection and does not reconnect on error', async () => {
        const { actions, createWatchConnection } = setup()

        actions.startWatch('ws-1')
        expect(createWatchConnection).toHaveBeenCalledTimes(1)

        const onError = createWatchConnection.mock.calls[0]![2]
        expect(onError).toBeTypeOf('function')
        onError?.(new Event('error'))

        await new Promise((resolve) => setTimeout(resolve, 30))
        expect(createWatchConnection).toHaveBeenCalledTimes(1)
    })

    it('startWatch replaces the previous connection', () => {
        const { actions, createWatchConnection } = setup()
        actions.startWatch('ws-1')
        actions.startWatch('ws-1')
        expect(createWatchConnection).toHaveBeenCalledTimes(2)
    })

    it('stopWatch tears down the active connection', () => {
        const { actions, cleanupWatch } = setup()
        actions.startWatch('ws-1')
        actions.stopWatch()
        expect(cleanupWatch).toHaveBeenCalledTimes(1)
    })
})
