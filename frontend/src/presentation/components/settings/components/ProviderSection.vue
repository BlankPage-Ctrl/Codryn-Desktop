<script setup lang="ts">
import { ref, h } from 'vue'
import { EditPencil, Plus, Star, Trash } from '@iconoir/vue'
import { pButton } from '@/presentation/components/button'
import type { Provider, Model } from '@/core/entities'
import type { ResolvedProviderSection } from '../types/resolved'

const props = defineProps<{
    resolved: ResolvedProviderSection
}>()

const PlusIcon = () => h(Plus, { width: 14, height: 14 })
const EditIcon = () => h(EditPencil, { width: 14, height: 14 })
const TrashIcon = () => h(Trash, { width: 14, height: 14 })
const StarIcon = () => h(Star, { width: 14, height: 14 })

const expandedProviderIds = ref<Set<string>>(new Set())

function isProviderExpanded(providerId: string): boolean {
    return expandedProviderIds.value.has(providerId)
}

function toggleProviderExpand(providerId: string) {
    const next = new Set(expandedProviderIds.value)
    if (next.has(providerId)) {
        next.delete(providerId)
    } else {
        next.add(providerId)
    }
    expandedProviderIds.value = next
}

function isDefault(p: Provider, m: Model): boolean {
    return props.resolved.defaultProviderId === p.id && props.resolved.defaultModelId === m.id
}

function maskKey(key?: string): string {
    if (!key) return ''
    if (key.length <= 8) return '***'
    return '***' + key.slice(-4)
}

function handleProviderAdd() {
    props.resolved.onAddProvider?.()
}
function handleProviderEdit(p: Provider) {
    props.resolved.onEditProvider?.(p)
}
function handleProviderDelete(p: Provider) {
    props.resolved.onDeleteProvider?.(p.id)
}
function handleModelAdd(providerId: string) {
    props.resolved.onAddModel?.(providerId)
}
function handleModelEdit(providerId: string, m: Model) {
    props.resolved.onEditModel?.(providerId, m.id, {
        modelId: m.modelId,
        displayName: m.displayName ?? '',
        maxInputTokens: m.maxInputTokens ?? undefined,
        maxOutputTokens: m.maxOutputTokens ?? undefined,
    })
}
function handleModelDelete(providerId: string, m: Model) {
    props.resolved.onDeleteModel?.(providerId, m.id)
}
function handleSetDefault(provider: Provider, model: Model) {
    props.resolved.onSetDefault?.(provider.id, model.id)
}
</script>

<template>
    <div>
        <div v-if="resolved.loading && !resolved.providers.length" class="section-empty">
            <span class="text-muted">Loading...</span>
        </div>

        <div v-else-if="resolved.error && !resolved.providers.length" class="section-empty">
            <span class="text-muted">{{ resolved.error }}</span>
        </div>

        <div v-else-if="!resolved.providers.length" class="section-empty">
            <span class="empty-text">No providers yet</span>
        </div>

        <div v-else class="provider-list">
            <div v-for="provider in resolved.providers" :key="provider.id" class="provider-card">
                <div class="provider-card-header" @click="toggleProviderExpand(provider.id)">
                    <span class="provider-name">{{ provider.name }}</span>
                    <span class="provider-type-badge">{{ provider.type }}</span>
                    <span v-if="provider.apiKey" class="provider-key">{{
                        maskKey(provider.apiKey)
                    }}</span>
                    <span v-if="provider.baseURL" class="provider-url">{{ provider.baseURL }}</span>
                    <div class="provider-actions" @click.stop>
                        <pButton
                            :schema="{
                                variant: 'ghost',
                                size: 'xs',
                                icon: PlusIcon,
                                iconPosition: 'only',
                                ariaLabel: 'Add model',
                            }"
                            @click="handleModelAdd(provider.id)"
                        />
                        <pButton
                            :schema="{
                                variant: 'ghost',
                                size: 'xs',
                                icon: EditIcon,
                                iconPosition: 'only',
                                ariaLabel: 'Edit',
                            }"
                            @click="handleProviderEdit(provider)"
                        />
                        <pButton
                            :schema="{
                                preset: 'danger',
                                size: 'xs',
                                icon: TrashIcon,
                                overrides: { variant: 'ghost', iconPosition: 'only' },
                                ariaLabel: 'Delete',
                            }"
                            @click="handleProviderDelete(provider)"
                        />
                    </div>
                </div>

                <div v-if="isProviderExpanded(provider.id)" class="provider-models">
                    <div v-if="!provider.models.length" class="model-empty">No models yet</div>
                    <div v-for="model in provider.models" :key="model.id" class="model-row">
                        <div class="model-info">
                            <span class="model-name">{{ model.displayName || model.modelId }}</span>
                            <span v-if="model.displayName" class="model-id">{{
                                model.modelId
                            }}</span>
                            <span v-if="model.maxInputTokens" class="model-limit"
                                >in:{{ model.maxInputTokens }}</span
                            >
                            <span v-if="model.maxOutputTokens" class="model-limit"
                                >out:{{ model.maxOutputTokens }}</span
                            >
                            <span v-if="isDefault(provider, model)" class="default-badge"
                                >Default</span
                            >
                        </div>
                        <div class="model-actions">
                            <pButton
                                v-if="!isDefault(provider, model)"
                                :schema="{
                                    variant: 'ghost',
                                    size: 'xs',
                                    icon: StarIcon,
                                    iconPosition: 'only',
                                    ariaLabel: 'Set as default',
                                }"
                                @click="handleSetDefault(provider, model)"
                            />
                            <pButton
                                :schema="{
                                    variant: 'ghost',
                                    size: 'xs',
                                    icon: EditIcon,
                                    iconPosition: 'only',
                                    ariaLabel: 'Edit',
                                }"
                                @click="handleModelEdit(provider.id, model)"
                            />
                            <pButton
                                :schema="{
                                    preset: 'danger',
                                    size: 'xs',
                                    icon: TrashIcon,
                                    overrides: { variant: 'ghost', iconPosition: 'only' },
                                    ariaLabel: 'Delete',
                                }"
                                @click="handleModelDelete(provider.id, model)"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section-footer">
            <pButton
                :schema="{ variant: 'ghost', size: 'sm', icon: PlusIcon, label: 'Add provider' }"
                @click="handleProviderAdd"
            />
        </div>
    </div>
</template>

<style scoped>
.provider-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.provider-card {
    border: 1px solid var(--border-color);
    border-radius: 4px;
    overflow: hidden;
    background: var(--bg-secondary);
}

.provider-card-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    flex-wrap: wrap;
    cursor: pointer;
}

.provider-name {
    font-family: var(--font-serif);
    font-size: var(--type-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
}

.provider-type-badge {
    font-size: var(--type-2xs);
    font-weight: var(--font-weight-medium);
    padding: 1px 5px;
    border-radius: 9999px;
    background: var(--border-color);
    color: var(--text-primary);
    opacity: 0.6;
    white-space: nowrap;
}

.provider-key {
    font-size: var(--type-2xs);
    font-family: var(--font-mono);
    color: var(--text-primary);
    opacity: 0.35;
}

.provider-url {
    font-size: var(--type-2xs);
    font-family: var(--font-mono);
    color: var(--text-primary);
    opacity: 0.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
}

.provider-actions {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
    margin-left: auto;
}

.provider-models {
    padding: 0 10px 6px;
    border-top: 1px solid var(--border-color);
}

.model-empty {
    padding: 6px 0 2px;
    font-size: var(--type-xs);
    color: var(--text-primary);
    opacity: 0.4;
}

.model-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 5px 0;
    position: relative;
}

.model-row:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    right: 0;
    height: 1px;
    background: var(--border-color);
}

.model-info {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
}

.model-name {
    font-size: var(--type-xs);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
}

.model-id {
    font-size: var(--type-2xs);
    font-family: var(--font-mono);
    color: var(--text-primary);
    opacity: 0.35;
}

.model-limit {
    font-size: var(--type-2xs);
    font-family: var(--font-mono);
    color: var(--text-primary);
    opacity: 0.35;
}

.default-badge {
    font-size: var(--type-2xs);
    font-weight: var(--font-weight-medium);
    padding: 1px 5px;
    border-radius: 9999px;
    background: var(--color-success);
    color: var(--color-success);
    white-space: nowrap;
}

.model-actions {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 100ms ease;
}

.model-row:hover .model-actions {
    opacity: 1;
}

.section-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 24px 8px;
}

.section-footer {
    margin-top: 8px;
}

.empty-text {
    font-size: var(--type-sm);
    color: var(--text-primary);
    opacity: 0.5;
}
</style>
