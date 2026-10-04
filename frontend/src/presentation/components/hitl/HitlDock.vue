<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import HitlApprovalCard from './components/HitlApprovalCard.vue'
import HitlAskCard from './components/HitlAskCard.vue'
import HitlChoiceCard from './components/HitlChoiceCard.vue'
import type { HitlDockSchema } from './types/schema'

const props = defineProps<{
    schema: HitlDockSchema | null
}>()

const expanded = ref(false)

const items = computed(() => props.schema?.items ?? [])

watch(items, (next) => {
    if (next.length <= 1) expanded.value = false
})

const visible = computed(() => (expanded.value ? items.value : items.value.slice(0, 1)))
const hiddenCount = computed(() => items.value.length - visible.value.length)
</script>

<template>
    <div v-if="items.length" class="hitl-dock" data-testid="hitl-dock">
        <template v-for="item in visible" :key="item.id">
            <HitlApprovalCard v-if="item.type === 'approval'" :schema="item" />
            <HitlAskCard v-else-if="item.type === 'ask'" :schema="item" />
            <HitlChoiceCard v-else-if="item.type === 'choice'" :schema="item" />
        </template>
        <button
            v-if="hiddenCount > 0 && !expanded"
            class="hitl-dock__more"
            type="button"
            @click="expanded = true"
        >
            +{{ hiddenCount }} more
        </button>
        <button v-if="expanded" class="hitl-dock__more" type="button" @click="expanded = false">
            Show less
        </button>
    </div>
</template>

<style scoped src="./styles/index.css"></style>
