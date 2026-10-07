import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FeedEvent, FeedMessage } from '@/core/entities'
import type { ChatSessionStatePatch } from '../chat-session.logic'
import { createChatSessionEngine } from '../chat-session.logic'

interface CapturedHandlers {
    onEvent: (event: FeedEvent) => void
    onSeq: (seq: number) => void
    onDone: () => void
    onError: (err: Error) => void
}

function createHarness() {
    const patches: Array<{ chatId: string; patch: ChatSessionStatePatch }> = []
    let captured: CapturedHandlers | null = null
    const calls = { starts: 0, cancels: 0, histories: 0, reverts: [] as string[] }
    const engine = createChatSessionEngine({
        messagesRepo: {
            loadHistory: async () => {
                calls.histories += 1
                return []
            },
            revert: async (_ws: string, _chat: string, messageId: string) => {
                calls.reverts.push(messageId)
                return { deletedMessageIds: [messageId], cancelledRunIds: ['run-1'] }
            },
        } as never,
        runsRepo: {
            list: async () => [],
            start: async () => {
                calls.starts += 1
                return { runId: `run-${calls.starts}` }
            },
            cancel: async () => {
                calls.cancels += 1
                return true
            },
        } as never,
        stream: {
            openStream: (
                _workspaceId: string,
                _chatId: string,
                _runId: string,
                _afterSeq: number,
                handlers: CapturedHandlers,
            ) => {
                captured = handlers
                return () => {}
            },
        } as never,
        onState: (chatId: string, patch: ChatSessionStatePatch) => {
            patches.push({ chatId, patch })
        },
    })
    return { engine, patches, calls, getCaptured: () => captured as unknown as CapturedHandlers }
}

function messagePatches(patches: Array<{ patch: ChatSessionStatePatch }>): FeedMessage[][] {
    return patches
        .filter((p) => p.patch.messages !== undefined)
        .map((p) => p.patch.messages as FeedMessage[])
}

const ASSISTANT_ID = 'msg-assistant'

function textOpen(): FeedEvent {
    return {
        type: 'text-open',
        messageId: ASSISTANT_ID,
        sliceId: 'txt-0',
        role: 'assistant',
    } as FeedEvent
}

function textDelta(delta: string): FeedEvent {
    return {
        type: 'text-delta',
        messageId: ASSISTANT_ID,
        sliceId: 'txt-0',
        delta,
        role: 'assistant',
    } as FeedEvent
}

function textClose(): FeedEvent {
    return {
        type: 'text-close',
        messageId: ASSISTANT_ID,
        sliceId: 'txt-0',
        role: 'assistant',
    } as FeedEvent
}

function runClose(): FeedEvent {
    return { type: 'run-close', status: 'done' } as FeedEvent
}

async function startStream(harness: ReturnType<typeof createHarness>): Promise<CapturedHandlers> {
    await harness.engine.sendMessage('ws-1', 'chat-1', 'hello')
    return harness.getCaptured()
}

describe('chat-session delta coalescing', () => {
    const realRaf = globalThis.requestAnimationFrame
    const realCancelRaf = globalThis.cancelAnimationFrame

    afterEach(() => {
        if (realRaf === undefined)
            delete (globalThis as Record<string, unknown>).requestAnimationFrame
        else globalThis.requestAnimationFrame = realRaf
        if (realCancelRaf === undefined)
            delete (globalThis as Record<string, unknown>).cancelAnimationFrame
        else globalThis.cancelAnimationFrame = realCancelRaf
        vi.restoreAllMocks()
    })

    it('coalesces text deltas into one store notification per frame', async () => {
        const queued: FrameRequestCallback[] = []
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            queued.push(cb)
            return queued.length
        })
        vi.stubGlobal('cancelAnimationFrame', () => {})

        const harness = createHarness()
        const handlers = await startStream(harness)
        const before = messagePatches(harness.patches).length

        handlers.onEvent(textOpen())
        for (const ch of ['a', 'b', 'c', 'd', 'e']) handlers.onEvent(textDelta(ch))

        // Structural open notified immediately; the 5 deltas are folded into
        // the cache with no store notification yet.
        expect(messagePatches(harness.patches).length).toBe(before + 1)

        for (const cb of queued.splice(0)) cb(0)
        const after = messagePatches(harness.patches)
        expect(after.length).toBe(before + 2)
        const last = after[after.length - 1]!
        const assistant = last.find((m) => m.id === ASSISTANT_ID)!
        expect(assistant.blocks).toEqual([
            { kind: 'text', sliceId: 'txt-0', text: 'abcde', closed: false },
        ])
    })

    it('flushes pending text on structural events and run-close', async () => {
        const queued: FrameRequestCallback[] = []
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            queued.push(cb)
            return queued.length
        })
        vi.stubGlobal('cancelAnimationFrame', () => {})

        const harness = createHarness()
        const handlers = await startStream(harness)
        handlers.onEvent(textOpen())
        handlers.onEvent(textDelta('a'))
        handlers.onEvent(textDelta('b'))
        expect(queued.length).toBe(1)

        // text-close is structural: pending text flushes synchronously.
        handlers.onEvent(textClose())
        const afterClose = messagePatches(harness.patches)
        const assistant = afterClose[afterClose.length - 1]!.find((m) => m.id === ASSISTANT_ID)!
        expect(assistant.blocks).toEqual([
            { kind: 'text', sliceId: 'txt-0', text: 'ab', closed: true },
        ])

        handlers.onEvent(textOpen())
        handlers.onEvent(textDelta('c'))
        handlers.onEvent(runClose())
        const atEnd = messagePatches(harness.patches)
        const finalAssistant = atEnd[atEnd.length - 1]!.find((m) => m.id === ASSISTANT_ID)!
        expect(finalAssistant.blocks).toEqual([
            { kind: 'text', sliceId: 'txt-0', text: 'ab', closed: true },
            { kind: 'text', sliceId: 'txt-0', text: 'c', closed: false },
        ])
        // Stale frame callbacks superseded by the run-close flush notify nothing.
        const countAtClose = harness.patches.length
        for (const cb of queued.splice(0)) cb(0)
        expect(harness.patches.length).toBe(countAtClose)
    })

    it('falls back to synchronous notify without rAF', async () => {
        vi.stubGlobal('requestAnimationFrame', undefined as unknown as typeof requestAnimationFrame)
        const harness = createHarness()
        const handlers = await startStream(harness)
        const before = messagePatches(harness.patches).length
        handlers.onEvent(textOpen())
        handlers.onEvent(textDelta('x'))
        handlers.onEvent(textDelta('y'))
        // open + 2 deltas, each notified synchronously.
        expect(messagePatches(harness.patches).length).toBe(before + 3)
    })

    it('drops deferred paint on dispose', async () => {
        const queued: FrameRequestCallback[] = []
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            queued.push(cb)
            return queued.length
        })
        vi.stubGlobal('cancelAnimationFrame', () => {})

        const harness = createHarness()
        const handlers = await startStream(harness)
        handlers.onEvent(textOpen())
        handlers.onEvent(textDelta('z'))
        harness.engine.dispose('chat-1')
        const countAfterDispose = harness.patches.length
        for (const cb of queued.splice(0)) cb(0)
        // The cancelled frame must not notify; dispose() itself only
        // detaches (no messages patch for the removed session).
        expect(harness.patches.length).toBe(countAfterDispose)
    })
})

describe('chat-session revert edit', () => {
    function userId(harness: ReturnType<typeof createHarness>): string {
        const first = messagePatches(harness.patches)[0]!
        return first.find((m) => m.role === 'user')!.id
    }

    it('beginEdit returns the user text without touching runs', async () => {
        const harness = createHarness()
        await harness.engine.sendMessage('ws-1', 'chat-1', 'hello')
        expect(harness.engine.beginEdit('chat-1', userId(harness))).toBe('hello')
        expect(harness.calls.cancels).toBe(0)
        expect(harness.calls.reverts).toEqual([])
    })

    it('beginEdit returns null for unknown and assistant messages', async () => {
        const harness = createHarness()
        await harness.engine.sendMessage('ws-1', 'chat-1', 'hello')
        expect(harness.engine.beginEdit('chat-1', 'nope')).toBeNull()
        expect(harness.engine.beginEdit('chat-1', ASSISTANT_ID)).toBeNull()
    })

    it('sendEdit drops the reverted tail surgically without reloading history', async () => {
        const harness = createHarness()
        await harness.engine.sendMessage('ws-1', 'chat-1', 'hello')
        const id = userId(harness)
        const result = await harness.engine.sendEdit('ws-1', 'chat-1', id, 'hello edited')
        expect(result.ok).toBe(true)
        expect(harness.calls.reverts).toEqual([id])
        expect(harness.calls.histories).toBe(0)
        // First send + resend after revert.
        expect(harness.calls.starts).toBe(2)
        const all = messagePatches(harness.patches)
        const last = all[all.length - 1]!
        expect(last.map((m: FeedMessage) => m.role)).toEqual(['user'])
        expect(last[0]!.blocks).toEqual([
            expect.objectContaining({ kind: 'text', text: 'hello edited' }),
        ])
    })

    it('sendEdit keeps messages before the tail and drops the rest', async () => {
        const harness = createHarness()
        await harness.engine.sendMessage('ws-1', 'chat-1', 'first')
        const patchesAfterFirst = messagePatches(harness.patches)
        const firstId = patchesAfterFirst[patchesAfterFirst.length - 1]!.find(
            (m) => m.role === 'user',
        )!.id
        await harness.engine.sendMessage('ws-1', 'chat-1', 'second')
        const patchesAfterSecond = messagePatches(harness.patches)
        const secondId = patchesAfterSecond[patchesAfterSecond.length - 1]!.find((m) =>
            m.blocks.some((b) => b.kind === 'text' && 'text' in b && b.text === 'second'),
        )!.id
        void firstId
        const result = await harness.engine.sendEdit('ws-1', 'chat-1', secondId, 'second edited')
        expect(result.ok).toBe(true)
        expect(harness.calls.histories).toBe(0)
        const all = messagePatches(harness.patches)
        const last = all[all.length - 1]!
        const texts = last.map((m) =>
            m.blocks.map((b) => (b.kind === 'text' ? b.text : '')).join(''),
        )
        expect(texts).toEqual(['first', 'second edited'])
    })

    it('sendEdit falls back to full reload when the revert result is inconsistent', async () => {
        const patches: Array<{ chatId: string; patch: ChatSessionStatePatch }> = []
        let starts = 0
        let histories = 0
        const engine = createChatSessionEngine({
            messagesRepo: {
                loadHistory: async () => {
                    histories += 1
                    return []
                },
                // Backend reports nothing deleted (and not the target id):
                // the local cache cannot be trusted, reload instead.
                revert: async () => ({ deletedMessageIds: [], cancelledRunIds: [] }),
            } as never,
            runsRepo: {
                list: async () => [],
                start: async () => {
                    starts += 1
                    return { runId: `run-${starts}` }
                },
                cancel: async () => true,
            } as never,
            stream: {
                openStream: () => () => {},
            } as never,
            onState: (chatId: string, patch: ChatSessionStatePatch) => {
                patches.push({ chatId, patch })
            },
        })
        await engine.sendMessage('ws-1', 'chat-1', 'hello')
        const first = messagePatches(patches)[0]!
        const id = first.find((m) => m.role === 'user')!.id
        const result = await engine.sendEdit('ws-1', 'chat-1', id, 'hello edited')
        expect(result.ok).toBe(true)
        expect(histories).toBe(1)
        expect(starts).toBe(2)
        const all = messagePatches(patches)
        const last = all[all.length - 1]!
        expect(last.map((m: FeedMessage) => m.role)).toEqual(['user'])
    })

    it('sendEdit surfaces revert failures without starting a run', async () => {
        const patches: Array<{ chatId: string; patch: ChatSessionStatePatch }> = []
        let starts = 0
        let captured: CapturedHandlers | null = null
        const engine = createChatSessionEngine({
            messagesRepo: {
                loadHistory: async () => [],
                revert: async () => {
                    throw new Error('revert boom')
                },
            } as never,
            runsRepo: {
                list: async () => [],
                start: async () => {
                    starts += 1
                    return { runId: `run-${starts}` }
                },
                cancel: async () => true,
            } as never,
            stream: {
                openStream: (
                    _workspaceId: string,
                    _chatId: string,
                    _runId: string,
                    _afterSeq: number,
                    handlers: CapturedHandlers,
                ) => {
                    captured = handlers
                    return () => {}
                },
            } as never,
            onState: (chatId: string, patch: ChatSessionStatePatch) => {
                patches.push({ chatId, patch })
            },
        })
        await engine.sendMessage('ws-1', 'chat-1', 'hello')
        const first = messagePatches(patches)[0]!
        const id = first.find((m) => m.role === 'user')!.id
        const result = await engine.sendEdit('ws-1', 'chat-1', id, 'hello edited')
        expect(result.ok).toBe(false)
        expect(starts).toBe(1)
        // Live stream untouched: still streaming, and events still land.
        expect(patches[patches.length - 1]!.patch.status).toBe('streaming')
        const before = messagePatches(patches).length
        captured!.onEvent(textOpen())
        expect(messagePatches(patches).length).toBe(before + 1)
    })
})

describe('chat-session error codes', () => {
    function lastError(
        patches: Array<{ patch: ChatSessionStatePatch }>,
    ): (Error & { code?: string }) | undefined {
        const found = [...patches].reverse().find((p) => p.patch.error !== undefined)
        return found?.patch.error as (Error & { code?: string }) | undefined
    }

    it('oops carries the backend code', async () => {
        const harness = createHarness()
        const handlers = await startStream(harness)
        handlers.onEvent({
            type: 'oops',
            message: 'Slow down',
            code: 'RATE_LIMITED',
        } as FeedEvent)
        const err = lastError(harness.patches)
        expect(err?.message).toBe('Slow down')
        expect(err?.code).toBe('RATE_LIMITED')
    })

    it('run-close failed carries the backend code', async () => {
        const harness = createHarness()
        const handlers = await startStream(harness)
        handlers.onEvent({
            type: 'run-close',
            status: 'failed',
            message: 'Bad key',
            code: 'UNAUTHORIZED',
        } as FeedEvent)
        const err = lastError(harness.patches)
        expect(err?.message).toBe('Bad key')
        expect(err?.code).toBe('UNAUTHORIZED')
    })

    it('run-close failed without code leaves code unset', async () => {
        const harness = createHarness()
        const handlers = await startStream(harness)
        handlers.onEvent({ type: 'run-close', status: 'failed', message: 'boom' } as FeedEvent)
        const err = lastError(harness.patches)
        expect(err?.message).toBe('boom')
        expect(err?.code).toBeUndefined()
    })
})

describe('chat-session revert preview and file restore', () => {
    function previewHarness() {
        const calls = { previews: [] as string[], restores: [] as Array<boolean | undefined> }
        const engine = createChatSessionEngine({
            messagesRepo: {
                loadHistory: async () => [],
                previewRevert: async (_ws: string, _chat: string, messageId: string) => {
                    calls.previews.push(messageId)
                    return {
                        targetMessageId: messageId,
                        fromPosition: 3,
                        suffixIds: [messageId, 'a-x'],
                        files: [
                            {
                                path: 'a.txt',
                                op: 'restored',
                                status: 'ok',
                                reason: null,
                                expectedHash: 'h1',
                                currentHash: 'h1',
                                lastWriter: null,
                            },
                        ],
                    }
                },
                revert: async (
                    _ws: string,
                    _chat: string,
                    messageId: string,
                    restoreFiles?: boolean,
                ) => {
                    calls.restores.push(restoreFiles)
                    return {
                        deletedMessageIds: [messageId],
                        cancelledRunIds: [],
                        fileRestore:
                            restoreFiles === true
                                ? { restored: [{ path: 'a.txt', op: 'restored' }], conflicts: [] }
                                : undefined,
                    }
                },
            } as never,
            runsRepo: {
                list: async () => [],
                start: async () => ({ runId: 'run-1' }),
                cancel: async () => true,
            } as never,
            stream: {
                openStream: () => () => {},
            } as never,
            onState: () => {},
        })
        return { engine, calls }
    }

    it('previewEdit returns the backend plan', async () => {
        const { engine, calls } = previewHarness()
        const preview = await engine.previewEdit('ws-1', 'chat-1', 'u-1')
        expect(calls.previews).toEqual(['u-1'])
        expect(preview?.suffixIds).toEqual(['u-1', 'a-x'])
        expect(preview?.files).toHaveLength(1)
        expect(preview?.files[0]?.status).toBe('ok')
    })

    it('previewEdit resolves null when the backend fails', async () => {
        const engine = createChatSessionEngine({
            messagesRepo: {
                loadHistory: async () => [],
                previewRevert: async () => {
                    throw new Error('preview boom')
                },
            } as never,
            runsRepo: { list: async () => [] } as never,
            stream: { openStream: () => () => {} } as never,
            onState: () => {},
        })
        expect(await engine.previewEdit('ws-1', 'chat-1', 'u-1')).toBeNull()
    })

    it('sendEdit forwards restoreFiles and returns the file restore', async () => {
        const { engine, calls } = previewHarness()
        await engine.sendMessage('ws-1', 'chat-1', 'hello')
        const result = await engine.sendEdit('ws-1', 'chat-1', 'u-1', 'hello edited', {
            restoreFiles: true,
        })
        expect(result.ok).toBe(true)
        expect(calls.restores).toEqual([true])
        expect(result.fileRestore?.restored).toEqual([{ path: 'a.txt', op: 'restored' }])
    })

    it('sendEdit defaults to conversation-only revert', async () => {
        const { engine, calls } = previewHarness()
        const result = await engine.sendEdit('ws-1', 'chat-1', 'u-1', 'hello edited')
        expect(result.ok).toBe(true)
        expect(calls.restores).toEqual([false])
        expect(result.fileRestore).toBeUndefined()
    })
})

describe('chat-session image attachments', () => {
    function captureHarness() {
        const started: unknown[] = []
        const patches: Array<{ chatId: string; patch: ChatSessionStatePatch }> = []
        const engine = createChatSessionEngine({
            messagesRepo: { loadHistory: async () => [] } as never,
            runsRepo: {
                list: async () => [],
                start: async (_ws: string, _chat: string, message: unknown) => {
                    started.push(message)
                    return { runId: 'run-1' }
                },
                cancel: async () => true,
            } as never,
            stream: { openStream: () => () => {} } as never,
            onState: (chatId: string, patch: ChatSessionStatePatch) => {
                patches.push({ chatId, patch })
            },
        })
        return { engine, started, patches }
    }

    it('sends file parts with attachment:// refs plus optimistic asset blocks', async () => {
        const { engine, started, patches } = captureHarness()
        await engine.sendMessage('ws-1', 'chat-1', 'look', [
            {
                attachmentId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
                mediaType: 'image/png',
                filename: 'shot.png',
                previewUrl: 'data:image/png;base64,AAA',
            },
        ])
        expect(started).toHaveLength(1)
        expect(started[0]).toEqual({
            id: expect.any(String),
            role: 'user',
            parts: [
                { type: 'text', text: 'look' },
                {
                    type: 'file',
                    mediaType: 'image/png',
                    url: 'attachment://aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
                    filename: 'shot.png',
                },
            ],
        })
        const optimistic = patches.find((p) => p.patch.messages !== undefined)?.patch.messages
        const user = optimistic?.find((m) => m.role === 'user')
        expect(user?.blocks).toEqual([
            expect.objectContaining({ kind: 'text', text: 'look' }),
            expect.objectContaining({
                kind: 'asset',
                assetKind: 'blob',
                url: 'data:image/png;base64,AAA',
                mediaType: 'image/png',
            }),
        ])
    })

    it('sends images-only messages without a text part', async () => {
        const { engine, started } = captureHarness()
        await engine.sendMessage('ws-1', 'chat-1', '   ', [
            {
                attachmentId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
                mediaType: 'image/jpeg',
            },
        ])
        expect(started).toHaveLength(1)
        expect(started[0]).toEqual({
            id: expect.any(String),
            role: 'user',
            parts: [
                {
                    type: 'file',
                    mediaType: 'image/jpeg',
                    url: 'attachment://aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
                },
            ],
        })
    })

    it('does not start a run for empty text without attachments', async () => {
        const { engine, started } = captureHarness()
        await engine.sendMessage('ws-1', 'chat-1', '   ')
        expect(started).toHaveLength(0)
    })
})

describe('chat-session token usage', () => {
    function usageHarness(getChatUsage: (ws: string, chat: string) => Promise<unknown>) {
        const patches: Array<{ chatId: string; patch: ChatSessionStatePatch }> = []
        const engine = createChatSessionEngine({
            messagesRepo: { loadHistory: async () => [], getChatUsage } as never,
            runsRepo: { list: async () => [] } as never,
            stream: { openStream: () => () => {} } as never,
            onState: (chatId: string, patch: ChatSessionStatePatch) => {
                patches.push({ chatId, patch })
            },
        })
        return { engine, patches }
    }

    it('patches usage after the backend responds', async () => {
        const usage = {
            chatId: 'chat-1',
            inputTokens: 6000,
            outputTokens: 2000,
            totalTokens: 8000,
            steps: 3,
        }
        const { engine, patches } = usageHarness(async () => usage)
        await engine.fetchUsage('ws-1', 'chat-1')
        expect(patches).toEqual([{ chatId: 'chat-1', patch: { usage } }])
    })

    it('keeps the previous value when the fetch fails', async () => {
        const { engine, patches } = usageHarness(async () => {
            throw new Error('backend down')
        })
        await engine.fetchUsage('ws-1', 'chat-1')
        expect(patches).toEqual([])
    })
})
