<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { MessagePartSchema } from '../../types/schema'
import { isRectInView, usePartSlotObserver } from '../../../../composables/usePartSlotObserver.ts'
import TextPart from './TextPart.vue'
import ReasoningPart from './ReasoningPart.vue'
import ToolCallPart from './ToolCallPart.vue'
import ToolCallGroupPart from './ToolCallGroupPart.vue'
import WorkLogGroupPart from './WorkLogGroupPart.vue'
import SourcePart from './SourcePart.vue'
import FilePart from './FilePart.vue'

const props = defineProps<{
    part: MessagePartSchema
}>()

const observer = usePartSlotObserver()

const el = ref<HTMLElement | null>(null)
const visible = ref(false)

const PLACEHOLDER_HEIGHT: Record<MessagePartSchema['type'], number> = {
    text: 24,
    reasoning: 40,
    'tool-call': 40,
    'tool-call-group': 48,
    'work-log': 48,
    source: 36,
    file: 36,
    'step-start': 28,
}

const placeholderStyle = computed(() =>
    visible.value ? undefined : { minHeight: PLACEHOLDER_HEIGHT[props.part.type] + 'px' },
)

function onEnter() {
    visible.value = true
    if (el.value) observer.unobserve(el.value)
}

onMounted(() => {
    if (!el.value) return
    if (isRectInView(el.value, observer.getRoot())) {
        onEnter()
        return
    }
    observer.observe(el.value, onEnter)
})

onBeforeUnmount(() => {
    if (el.value) observer.unobserve(el.value)
})
</script>

<template>
    <div ref="el" class="part-slot" :style="placeholderStyle">
        <TextPart v-if="visible && part.type === 'text'" :schema="part" />
        <ReasoningPart v-else-if="visible && part.type === 'reasoning'" :schema="part" />
        <ToolCallPart v-else-if="visible && part.type === 'tool-call'" :schema="part" />
        <ToolCallGroupPart v-else-if="visible && part.type === 'tool-call-group'" :schema="part" />
        <WorkLogGroupPart v-else-if="visible && part.type === 'work-log'" :schema="part" />
        <SourcePart v-else-if="visible && part.type === 'source'" :schema="part" />
        <FilePart v-else-if="visible && part.type === 'file'" :schema="part" />
        <!-- <StepIndicator v-else-if="visible && part.type === 'step-start'" :schema="part" /> -->
    </div>
</template>
