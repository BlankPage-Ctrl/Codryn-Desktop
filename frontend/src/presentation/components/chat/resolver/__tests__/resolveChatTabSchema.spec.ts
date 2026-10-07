import { describe, it, expect, vi } from 'vitest'
import { resolveChatTabSchema } from '../resolveChatTabSchema'
import type { ChatTabSchema } from '../../types/schema'

function makeSchema(overrides: Partial<ChatTabSchema> = {}): ChatTabSchema {
    return {
        title: 'Chat',
        chatId: 'chat-1',
        hitl: null,
        messages: [],
        providers: [],
        ...overrides,
    }
}

describe('resolveChatTabSchema error banner', () => {
    it('resolves null when no error', () => {
        const resolved = resolveChatTabSchema(makeSchema())
        expect(resolved.errorBanner).toBeNull()
    })

    it('maps message, code and dismiss through', () => {
        const onDismissError = vi.fn<() => void>()
        const resolved = resolveChatTabSchema(
            makeSchema({
                error: { message: 'Slow down', code: 'RATE_LIMITED' },
                onDismissError,
            }),
        )
        expect(resolved.errorBanner).toEqual({
            message: 'Slow down',
            code: 'RATE_LIMITED',
            onDismiss: onDismissError,
        })
    })

    it('omits code and onDismiss when absent', () => {
        const resolved = resolveChatTabSchema(makeSchema({ error: { message: 'boom' } }))
        expect(resolved.errorBanner).toEqual({ message: 'boom' })
    })

    it('passes ttlMs through when present', () => {
        const resolved = resolveChatTabSchema(
            makeSchema({ error: { message: 'boom', ttlMs: 1000 } }),
        )
        expect(resolved.errorBanner).toEqual({ message: 'boom', ttlMs: 1000 })
    })
})

describe('resolveChatTabSchema revert preview', () => {
    it('resolves null preview when absent', () => {
        const resolved = resolveChatTabSchema(makeSchema({ draftText: 'edited' }))
        expect(resolved.input.editDraft).toBe('edited')
        expect(resolved.input.revertPreview).toBeNull()
    })

    it('passes preview state and toggle handler through to the input', () => {
        const onToggleRestoreFiles = vi.fn<(enabled: boolean) => void>()
        const resolved = resolveChatTabSchema(
            makeSchema({
                draftText: 'edited',
                revertPreview: {
                    status: 'ready',
                    restoreFiles: false,
                    preview: {
                        targetMessageId: 'u-1',
                        fromPosition: 2,
                        suffixIds: ['u-1', 'a-1'],
                        files: [],
                    },
                },
                onToggleRestoreFiles,
            }),
        )
        expect(resolved.input.revertPreview).toEqual({
            status: 'ready',
            restoreFiles: false,
            preview: {
                targetMessageId: 'u-1',
                fromPosition: 2,
                suffixIds: ['u-1', 'a-1'],
                files: [],
            },
        })
        expect(resolved.input.onToggleRestoreFiles).toBe(onToggleRestoreFiles)
    })
})

describe('resolveChatTabSchema token usage', () => {
    it('resolves null usage when absent', () => {
        const resolved = resolveChatTabSchema(makeSchema())
        expect(resolved.input.usage).toBeNull()
    })

    it('derives used, limit and percent from the active model', () => {
        const resolved = resolveChatTabSchema(
            makeSchema({
                modelId: 'model-1',
                providers: [
                    {
                        id: 'provider-1',
                        name: 'Provider',
                        type: 'openai',
                        models: [
                            {
                                id: 'model-1',
                                modelId: 'gpt-4o',
                                providerId: 'provider-1',
                                maxInputTokens: 100000,
                                createdAt: '',
                                updatedAt: '',
                            },
                        ],
                        createdAt: '',
                        updatedAt: '',
                    },
                ],
                usage: {
                    chatId: 'chat-1',
                    inputTokens: 6000,
                    outputTokens: 2000,
                    totalTokens: 8000,
                    steps: 3,
                },
            }),
        )
        expect(resolved.input.usage).toEqual({ used: 8000, limit: 100000, percent: 8 })
    })

    it('falls back to the default limit when the model has none', () => {
        const resolved = resolveChatTabSchema(
            makeSchema({
                usage: {
                    chatId: 'chat-1',
                    inputTokens: 65536,
                    outputTokens: 0,
                    totalTokens: 65536,
                    steps: 1,
                },
            }),
        )
        expect(resolved.input.usage).toEqual({ used: 65536, limit: 131072, percent: 50 })
    })

    it('clamps percent at 100 when usage exceeds the limit', () => {
        const resolved = resolveChatTabSchema(
            makeSchema({
                usage: {
                    chatId: 'chat-1',
                    inputTokens: 200000,
                    outputTokens: 0,
                    totalTokens: 200000,
                    steps: 9,
                },
            }),
        )
        expect(resolved.input.usage).toEqual({ used: 200000, limit: 131072, percent: 100 })
    })
})
