<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Refresh, Server } from '@iconoir/vue'
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue'
import { mcpActions } from '@/application/actions'
import { useMcpStorer } from '@/application/stores'

const props = defineProps<{
    workspaceId: string | null
}>()

/** How long a toggle/refresh error stays in the card footer. */
const FOOTER_TTL_MS = 6000

const storer = useMcpStorer()

const isOpen = ref(false)
const referenceEl = ref<HTMLElement | null>(null)
const floatingEl = ref<HTMLElement | null>(null)
const footer = ref<{ prefix: string; text: string } | null>(null)
let footerTimer: ReturnType<typeof setTimeout> | null = null

const isOpenComputed = computed(() => isOpen.value)

const { floatingStyles } = useFloating(referenceEl, floatingEl, {
    placement: 'bottom-end',
    middleware: [offset(6), flip({ fallbackPlacements: ['bottom-end', 'top-end'] }), shift()],
    whileElementsMounted: autoUpdate,
    open: isOpenComputed,
})

const loading = computed(() => storer.loading)
const servers = computed(() => storer.servers)
const readyCount = computed(() => storer.readyCount)
const hasError = computed(() => storer.hasError)
const isToggling = (name: string) => storer.toggling[name] === true

function clearFooterTimer() {
    if (footerTimer) {
        clearTimeout(footerTimer)
        footerTimer = null
    }
}

function setFooter(prefix: string, text: string) {
    clearFooterTimer()
    footer.value = { prefix, text }
    footerTimer = setTimeout(() => {
        footer.value = null
        footerTimer = null
    }, FOOTER_TTL_MS)
}

watch(
    () => props.workspaceId,
    () => {
        clearFooterTimer()
        footer.value = null
    },
)

function toggle() {
    isOpen.value = !isOpen.value
}

function close() {
    isOpen.value = false
}

function statusTitle(status: string): string {
    if (status === 'error') return 'Error'
    if (status === 'disabled') return 'Off'
    return 'Ready'
}

async function onRefresh() {
    const id = props.workspaceId
    if (!id || storer.loading) return
    await mcpActions.refresh(id)
    const err = storer.error
    if (err) setFooter('Refresh', err)
}

async function onToggle(name: string, enabled: boolean) {
    const id = props.workspaceId
    if (!id || isToggling(name)) return
    await mcpActions.setEnabled(id, name, enabled)
    const row = storer.servers.find((s) => s.name === name)
    // The switch is bound to the store, so a failed toggle snaps back -
    // surface the reason in the footer instead of failing silently.
    if (!row || row.enabled !== enabled) {
        setFooter(name, storer.error ?? `failed to turn ${enabled ? 'on' : 'off'} ${name}`)
    }
}

function onClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement
    if (referenceEl.value?.contains(target)) return
    if (floatingEl.value?.contains(target)) return
    close()
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen.value) {
        e.stopPropagation()
        close()
    }
}

onMounted(() => {
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
    document.removeEventListener('mousedown', onClickOutside)
    document.removeEventListener('keydown', onKeydown)
    clearFooterTimer()
})
</script>

<template>
    <div class="mcp-pop">
        <button
            ref="referenceEl"
            class="mcp-btn"
            :class="{ 'mcp-btn--open': isOpen }"
            @click="toggle"
            title="MCP servers"
            aria-label="MCP servers"
            aria-haspopup="dialog"
            :aria-expanded="isOpen"
        >
            <Server width="14" height="14" />
            <span
                v-if="hasError || readyCount > 0"
                class="mcp-btn__dot"
                :class="{ 'mcp-btn__dot--error': hasError }"
                aria-hidden="true"
            />
        </button>

        <div v-if="isOpen" ref="floatingEl" class="mcp-floating" :style="floatingStyles">
            <Transition name="mcp-fade" appear>
                <div v-if="isOpen" class="mcp-card" role="dialog" aria-label="MCP servers">
                    <div class="mcp-card__head">
                        <span class="mcp-card__title">MCP</span>
                        <button
                            class="mcp-card__refresh"
                            :disabled="!workspaceId || loading"
                            title="Refresh server list"
                            aria-label="Refresh server list"
                            @click="onRefresh"
                        >
                            <Refresh width="12" height="12" :class="{ 'mcp-spin': loading }" />
                        </button>
                    </div>
                    <p v-if="storer.source" class="mcp-card__source" :title="storer.source">
                        {{ storer.source }}
                    </p>
                    <div class="mcp-card__sep" />

                    <div v-if="loading && servers.length === 0" class="mcp-card__hint">
                        Loading…
                    </div>
                    <div v-else-if="!workspaceId" class="mcp-card__hint">
                        Select a workspace first.
                    </div>
                    <div v-else-if="servers.length === 0" class="mcp-card__hint">
                        No MCP servers in .mcp.json.
                    </div>
                    <ul v-else class="mcp-list">
                        <li v-for="srv in servers" :key="srv.name" class="mcp-row">
                            <span
                                class="mcp-row__dot"
                                :class="`mcp-row__dot--${srv.status}`"
                                :title="statusTitle(srv.status)"
                                aria-hidden="true"
                            />
                            <div class="mcp-row__body">
                                <div class="mcp-row__top">
                                    <span class="mcp-row__name" :title="srv.name">{{
                                        srv.name
                                    }}</span>
                                    <label
                                        class="mcp-switch"
                                        :title="`Turn ${srv.name} ${srv.enabled ? 'off' : 'on'}`"
                                    >
                                        <input
                                            type="checkbox"
                                            :checked="srv.enabled"
                                            :disabled="isToggling(srv.name)"
                                            @change="
                                                onToggle(
                                                    srv.name,
                                                    ($event.target as HTMLInputElement).checked,
                                                )
                                            "
                                        />
                                        <span class="mcp-switch__track" aria-hidden="true" />
                                    </label>
                                </div>
                                <!-- //<div class="mcp-row__meta">
                                    {{ srv.transport || 'stdio' }} - {{ srv.tools }}
                                    {{ srv.tools === 1 ? 'tool' : 'tools' }}
                                </div> -->
                                <div
                                    v-if="srv.status === 'error' && srv.error"
                                    class="mcp-row__error"
                                    :title="srv.error"
                                >
                                    {{ srv.error }}
                                </div>
                            </div>
                        </li>
                    </ul>

                    <div class="mcp-card__footer">
                        <span
                            v-if="footer"
                            class="mcp-card__result"
                            :title="`${footer.prefix}: ${footer.text}`"
                        >
                            {{ footer.prefix }}: {{ footer.text }}
                        </span>
                        <span v-else-if="workspaceId && servers.length > 0" class="mcp-card__hint">
                            {{ readyCount }} of {{ servers.length }} ready
                        </span>
                    </div>
                </div>
            </Transition>
        </div>
    </div>
</template>

<style scoped>
.mcp-pop {
    position: relative;
    display: flex;
    flex-shrink: 0;
    -webkit-app-region: no-drag;
}

.mcp-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
    border: none;
    transition: background-color 80ms ease;
}

.mcp-btn:hover,
.mcp-btn--open {
    background: rgba(var(--raw-border-color), 0.3);
}

.mcp-btn__dot {
    position: absolute;
    top: 3px;
    right: 3px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent, #8250df);
}

.mcp-btn__dot--error {
    background: var(--color-danger, #e5534b);
}

.mcp-floating {
    z-index: 1000;
}

.mcp-card {
    width: 280px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 10px 8px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-top: 0px;
    border-radius: 0px 0px 4px 4px;
    box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.08),
        0 2px 4px rgba(0, 0, 0, 0.06);
}

.mcp-card__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.mcp-card__title {
    font-size: var(--type-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
}

.mcp-card__refresh {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    background: transparent;
    border: none;
    color: var(--text-primary);
    opacity: 0.75;
    cursor: pointer;
    transition: background-color 80ms ease;
}

.mcp-card__refresh:hover:not(:disabled) {
    background: rgba(var(--raw-border-color), 0.3);
    opacity: 1;
}

.mcp-card__refresh:disabled {
    opacity: 0.35;
    cursor: default;
}

.mcp-spin {
    animation: mcp-spin 900ms linear infinite;
}

@keyframes mcp-spin {
    to {
        transform: rotate(360deg);
    }
}

.mcp-card__source {
    margin: 0;
    font-size: var(--type-2xs);
    color: var(--text-primary);
    opacity: 0.5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.mcp-card__sep {
    border-top: 1px solid var(--border-color);
    margin: 2px 0;
}

.mcp-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 260px;
    overflow-y: auto;
}

.mcp-row {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 6px 6px;
    border-radius: 4px;
}

.mcp-row:hover {
    background: rgba(var(--raw-border-color), 0.18);
}

.mcp-row__dot {
    width: 7px;
    height: 7px;
    margin-top: 4px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--text-primary);
    opacity: 0.35;
}

.mcp-row__dot--ready {
    background: var(--color-success, #3fb950);
    opacity: 1;
}

.mcp-row__dot--error {
    background: var(--color-danger, #e5534b);
    opacity: 1;
}

.mcp-row__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.mcp-row__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.mcp-row__name {
    flex: 1;
    min-width: 0;
    font-size: var(--type-xs);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.mcp-row__meta {
    font-size: var(--type-2xs);
    color: var(--text-primary);
    opacity: 0.55;
}

.mcp-row__error {
    font-size: var(--type-2xs);
    line-height: 1.4;
    color: var(--color-danger, #e5534b);
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.mcp-switch {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    cursor: pointer;
}

.mcp-switch input {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    cursor: pointer;
}

.mcp-switch input:disabled {
    cursor: default;
}

.mcp-switch__track {
    display: block;
    width: 26px;
    height: 15px;
    border-radius: 999px;
    background: rgba(var(--raw-border-color), 0.45);
    position: relative;
    transition: background-color 120ms ease;
}

.mcp-switch__track::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: var(--text-primary);
    opacity: 0.7;
    transition:
        transform 120ms ease,
        opacity 120ms ease;
}

.mcp-switch input:checked + .mcp-switch__track {
    background: var(--accent, #8250df);
}

.mcp-switch input:checked + .mcp-switch__track::after {
    transform: translateX(11px);
    background: #fff;
    opacity: 1;
}

.mcp-switch input:disabled + .mcp-switch__track {
    opacity: 0.45;
}

.mcp-card__hint {
    font-size: var(--type-2xs);
    color: var(--text-primary);
    opacity: 0.6;
}

.mcp-card__footer {
    font-size: var(--type-2xs);
    color: var(--text-primary);
    opacity: 0.6;
}

.mcp-card__result {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--color-danger, #e5534b);
    opacity: 1;
}

.mcp-fade-enter-active {
    transition:
        opacity 120ms ease,
        transform 120ms ease;
}

.mcp-fade-leave-active {
    transition:
        opacity 80ms ease,
        transform 80ms ease;
}

.mcp-fade-enter-from {
    opacity: 0;
    transform: translateY(-4px);
}

.mcp-fade-leave-to {
    opacity: 0;
    transform: translateY(-2px);
}
</style>
