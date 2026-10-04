<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CodeBrackets } from '@iconoir/vue'
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue'
import { insightActions } from '@/application/actions'
import { useInsightStorer, useThemeStorer } from '@/application/stores'
import { Markdown, type MarkdownSchema } from '@/presentation/components/markdown'

const props = defineProps<{
    workspaceId: string | null
}>()

/** How long the Sync/Index result (or error) stays in the card footer. */
const FOOTER_TTL_MS = 6000

/** Experimental-feature disclaimer shown before Insight can be enabled. */
const INSIGHT_DISCLAIMER_MD = `**Insight is an experimental feature and is disabled by default.**

When enabled, Insight is **read-only with respect to your system and source code**. It does not modify your files or source code. The only write operations performed by Insight are to the application's own SQLite database for storing internal data.

By enabling this feature, you acknowledge that it is experimental and use it at your own risk. The author is not responsible for any damage, data loss, corruption, or other consequences resulting from its use.

**If you "Enable" it you understand and accept these conditions.**`

/** localStorage key (per workspace) tracking whether the disclaimer was read/accepted. */
const disclaimerReadKey = (workspaceId: string) => `insight:disclaimer-read:${workspaceId}`

const storer = useInsightStorer()
const themeStorer = useThemeStorer()

const showDisclaimer = ref(false)
const disclaimerMode = ref<'gate' | 'info'>('gate')

const disclaimerSchema = computed<MarkdownSchema>(() => ({
    text: INSIGHT_DISCLAIMER_MD,
    state: 'done',
    isDark: themeStorer.activeThemeId === 'night',
    fontSize: 13,
    lineHeight: 1.55,
}))

function hasReadDisclaimer(workspaceId: string): boolean {
    try {
        return localStorage.getItem(disclaimerReadKey(workspaceId)) === '1'
    } catch {
        return false
    }
}

function markDisclaimerRead(workspaceId: string): void {
    try {
        localStorage.setItem(disclaimerReadKey(workspaceId), '1')
    } catch {
        /* private mode etc. - gating still works, just re-prompts next time */
    }
}

const isOpen = ref(false)
const referenceEl = ref<HTMLElement | null>(null)
const floatingEl = ref<HTMLElement | null>(null)
const footer = ref<{ prefix: 'Sync' | 'Index' | 'Insight'; text: string; isError: boolean } | null>(
    null,
)
let footerTimer: ReturnType<typeof setTimeout> | null = null

const isOpenComputed = computed(() => isOpen.value)

const { floatingStyles } = useFloating(referenceEl, floatingEl, {
    placement: 'bottom-end',
    middleware: [offset(6), flip({ fallbackPlacements: ['bottom-end', 'top-end'] }), shift()],
    whileElementsMounted: autoUpdate,
    open: isOpenComputed,
})

const busy = computed(() => storer.syncing)
const enabled = computed(() => storer.enabled)
const toggling = computed(() => storer.loading || storer.syncing)
const canAct = computed(() => props.workspaceId !== null && storer.enabled && !storer.syncing)

function clearFooterTimer() {
    if (footerTimer) {
        clearTimeout(footerTimer)
        footerTimer = null
    }
}

function setFooter(entry: {
    prefix: 'Sync' | 'Index' | 'Insight'
    text: string
    isError: boolean
}) {
    clearFooterTimer()
    footer.value = entry
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
        showDisclaimer.value = false
    },
)

function toggle() {
    isOpen.value = !isOpen.value
}

function close() {
    isOpen.value = false
}

function formatTime(iso: string | null): string {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

async function applyEnabled(id: string, v: boolean) {
    await insightActions.setEnabled(id, v)
    // The checkbox is bound to the store, so a failed toggle snaps back -
    // surface the reason in the footer instead of failing silently.
    if (storer.enabled !== v) {
        setFooter({
            prefix: 'Insight',
            text: storer.error ?? 'failed to update Insight setting',
            isError: true,
        })
    }
}

async function onToggleEnabled(e: Event) {
    const id = props.workspaceId
    const el = e.target as HTMLInputElement
    // Ignore clicks while a backend round-trip is in flight; the store is
    // the single source of truth and only flips after the backend answers.
    if (toggling.value) {
        el.checked = storer.enabled
        return
    }
    const v = el.checked
    // The checkbox is natively toggled by the browser before `change` fires,
    // but `:checked` only re-renders when the store changes - so any path
    // that leaves the store untouched must revert the DOM explicitly.
    if (!id) {
        el.checked = storer.enabled
        return
    }
    // Disabling needs no confirmation and never touches the read flag.
    if (!v) {
        await applyEnabled(id, false)
        el.checked = storer.enabled
        return
    }
    // Enabling = accepting the disclaimer. Prompt once per workspace.
    if (hasReadDisclaimer(id)) {
        await applyEnabled(id, true)
        el.checked = storer.enabled
        return
    }
    el.checked = storer.enabled
    disclaimerMode.value = 'gate'
    showDisclaimer.value = true
}

/** Info-only view of the disclaimer - never enables, never touches the read flag. */
function openDisclaimerInfo() {
    disclaimerMode.value = 'info'
    showDisclaimer.value = true
}

function closeDisclaimer() {
    showDisclaimer.value = false
}

async function onDisclaimerEnable() {
    const id = props.workspaceId
    showDisclaimer.value = false
    if (!id) return
    markDisclaimerRead(id)
    await applyEnabled(id, true)
}

async function onSync() {
    const id = props.workspaceId
    if (!id || storer.syncing) return
    await insightActions.sync(id)
    const err = storer.error
    if (err) {
        setFooter({ prefix: 'Sync', text: err, isError: true })
        return
    }
    const t = formatTime(storer.lastSyncAt)
    setFooter({ prefix: 'Sync', text: t ? `ok · ${t}` : 'ok', isError: false })
}

async function onIndex() {
    const id = props.workspaceId
    if (!id || storer.syncing) return
    const res = await insightActions.index(id)
    const err = storer.error
    if (!res || err) {
        setFooter({ prefix: 'Index', text: err ?? 'failed', isError: true })
        return
    }
    setFooter({
        prefix: 'Index',
        text: `checked ${res.filesChecked} · +${res.added} ~${res.modified} −${res.removed}`,
        isError: false,
    })
}

function onClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement
    if (showDisclaimer.value) return
    if (referenceEl.value?.contains(target)) return
    if (floatingEl.value?.contains(target)) return
    close()
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && showDisclaimer.value) {
        e.stopPropagation()
        closeDisclaimer()
        return
    }
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
    <div class="insight-pop">
        <button
            ref="referenceEl"
            class="insight-btn"
            :class="{ 'insight-btn--open': isOpen }"
            @click="toggle"
            title="Insight"
            aria-label="Insight"
            aria-haspopup="dialog"
            :aria-expanded="isOpen"
        >
            <CodeBrackets width="14" height="14" />
            <span v-if="busy" class="insight-btn__dot" aria-hidden="true" />
        </button>

        <div v-if="isOpen" ref="floatingEl" class="insight-floating" :style="floatingStyles">
            <Transition name="insight-fade" appear>
                <div v-if="isOpen" class="insight-card" role="dialog" aria-label="Insight">
                    <div class="insight-card__head">
                        <span class="insight-card__title-group">
                            <span class="insight-card__title">Insight</span>
                            <button
                                type="button"
                                class="insight-card__disclaimer"
                                title="Read the Insight experimental-feature disclaimer"
                                @click="openDisclaimerInfo"
                            >
                                Disclaimer
                            </button>
                        </span>
                        <label
                            class="insight-card__enable"
                            title="Enable or disable Insight for this workspace"
                        >
                            <input
                                type="checkbox"
                                :checked="enabled"
                                :disabled="!workspaceId || toggling"
                                @change="onToggleEnabled"
                            />
                            <span>Enabled</span>
                        </label>
                    </div>
                    <p class="insight-card__desc">
                        Builds a deterministic, repeatable representation of a source with stable
                        identifiers.
                    </p>
                    <div class="insight-card__sep" />
                    <div class="insight-card__actions">
                        <button class="insight-card__btn" :disabled="!canAct" @click="onSync">
                            Sync
                        </button>
                        <button class="insight-card__btn" :disabled="!canAct" @click="onIndex">
                            Index
                        </button>
                    </div>
                    <div
                        class="insight-card__footer"
                        :class="{ 'insight-card__footer--error': footer?.isError }"
                    >
                        <span
                            v-if="footer"
                            class="insight-card__result"
                            :title="`${footer.prefix}: ${footer.text}`"
                        >
                            {{ footer.prefix }}: {{ footer.text }}
                        </span>
                        <span v-else-if="!workspaceId" class="insight-card__hint">
                            Select a workspace first.
                        </span>
                        <span v-else-if="!enabled" class="insight-card__hint">
                            Insight is disabled.
                        </span>
                        <span v-else-if="busy" class="insight-card__hint">Working…</span>
                    </div>
                </div>
            </Transition>
        </div>
        <Teleport to="body">
            <div
                v-if="showDisclaimer"
                class="insight-disclaimer-overlay"
                @click.self="closeDisclaimer"
            >
                <div
                    class="insight-disclaimer-panel"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Insight disclaimer"
                >
                    <div class="insight-disclaimer-head">
                        <span class="insight-disclaimer-title">Insight — experimental feature</span>
                    </div>
                    <div class="insight-disclaimer-body">
                        <Markdown :schema="disclaimerSchema" />
                    </div>
                    <div class="insight-disclaimer-foot">
                        <button
                            type="button"
                            class="insight-disclaimer-btn"
                            @click="closeDisclaimer"
                        >
                            Close
                        </button>
                        <button
                            v-if="disclaimerMode === 'gate'"
                            type="button"
                            class="insight-disclaimer-btn insight-disclaimer-btn--primary"
                            :disabled="!workspaceId || toggling"
                            @click="onDisclaimerEnable"
                        >
                            Enable
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<style scoped>
.insight-pop {
    position: relative;
    display: flex;
    flex-shrink: 0;
    -webkit-app-region: no-drag;
}

.insight-btn {
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

.insight-btn:hover,
.insight-btn--open {
    background: rgba(var(--raw-border-color), 0.3);
}

.insight-btn__dot {
    position: absolute;
    top: 3px;
    right: 3px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent, #8250df);
}

.insight-floating {
    z-index: 1000;
}

.insight-card {
    width: 240px;
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

.insight-card__title {
    font-size: var(--type-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
}

.insight-card__title-group {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
}

.insight-card__disclaimer {
    padding: 0;
    border: none;
    background: transparent;
    font-size: var(--type-2xs);
    color: var(--text-primary);
    opacity: 0.6;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
    white-space: nowrap;
}

.insight-card__disclaimer:hover {
    opacity: 1;
}

.insight-card__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.insight-card__enable {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--type-2xs);
    color: var(--text-primary);
    opacity: 0.75;
    cursor: pointer;
    white-space: nowrap;
}

.insight-card__enable input {
    width: 12px;
    height: 12px;
    margin: 0;
    cursor: pointer;
    accent-color: var(--accent, #8250df);
}

.insight-card__enable input:disabled {
    cursor: default;
}

.insight-card__desc {
    margin: 0;
    font-size: var(--type-2xs);
    line-height: 1.45;
    color: var(--text-primary);
    opacity: 0.65;
}

.insight-card__sep {
    border-top: 1px solid var(--border-color);
    margin: 2px 0;
}

.insight-card__actions {
    display: flex;
    gap: 6px;
}

.insight-card__btn {
    flex: 1;
    height: 24px;
    padding: 0 0px;
    font-size: var(--type-2xs);
    font-weight: var(--font-weight-medium);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-primary);
    color: var(--text-primary);
    cursor: pointer;
    transition: background-color 80ms ease;
}

.insight-card__btn:hover:not(:disabled) {
    background: rgba(var(--raw-border-color), 0.3);
}

.insight-card__btn:disabled {
    opacity: 0.4;
    cursor: default;
}

.insight-card__footer {
    font-size: var(--type-2xs);
    color: var(--text-primary);
    opacity: 0.6;
}

.insight-card__footer--error {
    opacity: 1;
    color: var(--color-danger, #e5534b);
}

.insight-card__result {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.insight-card__hint {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.insight-fade-enter-active {
    transition:
        opacity 120ms ease,
        transform 120ms ease;
}

.insight-fade-leave-active {
    transition:
        opacity 80ms ease,
        transform 80ms ease;
}

.insight-fade-enter-from {
    opacity: 0;
    transform: translateY(-4px);
}

.insight-fade-leave-to {
    opacity: 0;
    transform: translateY(-2px);
}

.insight-disclaimer-overlay {
    position: fixed;
    inset: 0;
    z-index: 1100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background-color: rgba(15, 15, 20, 0.45);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
}

.insight-disclaimer-panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow: hidden;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
}

.insight-disclaimer-head {
    padding: 10px 12px;
    border-bottom: 1px solid var(--border-color);
}

.insight-disclaimer-title {
    font-size: var(--type-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
}

.insight-disclaimer-body {
    padding: 10px 12px;
    overflow-y: auto;
}

.insight-disclaimer-foot {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    padding: 10px 12px;
    border-top: 1px solid var(--border-color);
}

.insight-disclaimer-btn {
    height: 26px;
    padding: 0 12px;
    font-size: var(--type-2xs);
    font-weight: var(--font-weight-medium);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-primary);
    color: var(--text-primary);
    cursor: pointer;
    transition: background-color 80ms ease;
}

.insight-disclaimer-btn:hover:not(:disabled) {
    background: rgba(var(--raw-border-color), 0.3);
}

.insight-disclaimer-btn:disabled {
    opacity: 0.4;
    cursor: default;
}

.insight-disclaimer-btn--primary {
    background: var(--border-color);
    border-color: transparent;
    color: var(--text-primary);
}

.insight-disclaimer-btn--primary:hover:not(:disabled) {
    background: var(--border-color);
    filter: brightness(1.08);
}
</style>
