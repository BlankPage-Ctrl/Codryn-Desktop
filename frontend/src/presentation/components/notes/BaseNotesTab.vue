<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import type { ResolvedNotesTab } from './types/resolved'
import NoteNameField from './components/NoteNameField.vue'
import NoteDescField from './components/NoteDescField.vue'
import NoteDetailsEditor from './components/NoteDetailsEditor.vue'
import DownPanel from './components/DownPanel.vue'

const props = defineProps<{
    resolved: ResolvedNotesTab
}>()

const draft = reactive({
    name: props.resolved.note.name,
    desc: props.resolved.note.desc,
    details: props.resolved.note.details,
    priority: props.resolved.note.priority,
    category_id: props.resolved.note.category_id,
})

watch(
    () => [props.resolved.note.version, props.resolved.note.updated_at],
    () => {
        draft.name = props.resolved.note.name
        draft.desc = props.resolved.note.desc
        draft.details = props.resolved.note.details
        draft.priority = props.resolved.note.priority
        draft.category_id = props.resolved.note.category_id
    },
)

const dirty = computed(() => {
    const n = props.resolved.note
    return (
        draft.name !== n.name ||
        draft.desc !== n.desc ||
        draft.details !== n.details ||
        draft.priority !== n.priority ||
        draft.category_id !== n.category_id
    )
})

const detailsValid = computed(() => draft.details.trim().length > 0)

function commitName(name: string) {
    draft.name = name
    props.resolved.onNameCommit?.(name)
}

function commitDesc(desc: string) {
    draft.desc = desc
    props.resolved.onDescCommit?.(desc)
}

function commitDetails(details: string) {
    draft.details = details
    props.resolved.onDetailsCommit?.(details)
}

function changePriority(priority: string) {
    draft.priority = priority as ResolvedNotesTab['note']['priority']
    props.resolved.onPriorityChange?.(draft.priority)
}
</script>

<template>
    <div class="note-tab">
        <div class="note-tab__scroll">
            <div class="note-tab__header">
                <NoteNameField
                    :value="draft.name"
                    :autofocus="resolved.autofocusName"
                    @commit="commitName"
                />
                <NoteDescField :value="draft.desc" @commit="commitDesc" />
                <!-- <div class="note-tab__pickers">
                    <NoteCategoryPicker
                        :value="draft.category_id"
                        :categories="resolved.categories"
                        @change="changeCategory"
                    />
                </div> -->
            </div>

            <div class="note-tab__details">
                <NoteDetailsEditor :value="draft.details" @change="commitDetails" />
            </div>
        </div>

        <DownPanel
            :dirty="dirty"
            :saving="resolved.saving"
            :saved-at="resolved.savedAt"
            :priority="draft.priority"
            :details-valid="detailsValid"
            @save="resolved.onSave?.()"
            @priority-change="changePriority"
        />
    </div>
</template>

<style src="./styles/index.css"></style>
