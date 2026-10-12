<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus } from '@iconoir/vue'
import BaseFolderPicker from '@/presentation/components/dialog/inputs/BaseFolderPicker.vue'

const emit = defineEmits<{
    register: [pluginId: string, pluginDir: string]
}>()

const pluginId = ref('')
const pluginDir = ref('')

const canRegister = computed(() => pluginId.value.trim() !== '' && pluginDir.value.trim() !== '')

function onFolderPick() {
    if (pluginDir.value) {
        const name = pluginDir.value.split('/').pop() ?? ''
        pluginId.value = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
    }
}

function handleRegister() {
    const id = pluginId.value.trim()
    const dir = pluginDir.value.trim()
    if (!id || !dir) return
    emit('register', id, dir)
    pluginId.value = ''
    pluginDir.value = ''
}
</script>

<template>
    <div class="plugin-register">
        <span class="register-title">Add plugin</span>
        <p class="register-hint">Choose a folder that contains a codryn-plugin.json file.</p>
        <BaseFolderPicker
            v-model="pluginDir"
            button-text="Choose folder"
            placeholder="No folder selected"
            @input="onFolderPick"
        />
        <div class="register-row">
            <input
                v-model="pluginId"
                class="register-input"
                placeholder="Plugin id"
                aria-label="Plugin id"
                @keyup.enter="handleRegister"
            />
            <button
                class="plugin-icon-btn plugin-icon-btn--add"
                title="Add plugin"
                aria-label="Add plugin"
                :disabled="!canRegister"
                @click="handleRegister"
            >
                <Plus width="14" height="14" />
            </button>
        </div>
    </div>
</template>

<style src="../styles/index.css"></style>
