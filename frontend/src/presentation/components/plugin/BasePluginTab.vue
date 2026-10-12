<script setup lang="ts">
import type { ResolvedPluginTab } from './types/resolved'
import RegisterForm from './components/RegisterForm.vue'
import PluginList from './components/PluginList.vue'

defineProps<{
    resolved: ResolvedPluginTab
}>()
</script>

<template>
    <div class="plugin-tab-content">
        <RegisterForm @register="(id, dir) => resolved.onRegister(id, dir)" />
        <PluginList
            :discovered="resolved.discovered"
            :loading="resolved.loading"
            :error="resolved.error"
            :on-discover="resolved.onDiscover"
            :on-register="resolved.onRegister"
            :on-unregister="resolved.onUnregister"
            :on-toggle="resolved.onToggle"
        />
    </div>
</template>

<style src="./styles/index.css"></style>
