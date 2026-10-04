<script setup lang="ts">
import type { ResolvedButton } from './types/resolved.ts'
import RippleEffect from './RippleEffect.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{ resolved: ResolvedButton }>()
const emit = defineEmits<{ click: [e: MouseEvent] }>()

function onClick(e: MouseEvent) {
    if (!props.resolved.interaction.isDisabled) {
        emit('click', e)
    }
}
</script>

<style src="./styles/index.css"></style>

<template>
    <component
        :is="resolved.tag"
        :class="resolved.classes.root"
        v-bind="resolved.attrs"
        @click="onClick"
    >
        <span :class="resolved.classes.inner">
            <span v-if="resolved.content.showSpinner" :class="resolved.classes.spinner" />

            <span
                v-if="resolved.content.showIcon && resolved.content.iconPosition !== 'right'"
                :class="resolved.classes.icon"
            >
                <component
                    :is="resolved.content.icon"
                    v-if="resolved.content.icon && typeof resolved.content.icon !== 'string'"
                />
                <span
                    v-else-if="typeof resolved.content.icon === 'string'"
                    v-text="resolved.content.icon"
                />
            </span>

            <span v-if="resolved.content.showLabel" :class="resolved.classes.label">
                {{ resolved.content.label }}
            </span>

            <span
                v-if="resolved.content.showIcon && resolved.content.iconPosition === 'right'"
                :class="resolved.classes.icon"
            >
                <component
                    :is="resolved.content.icon"
                    v-if="resolved.content.icon && typeof resolved.content.icon !== 'string'"
                />
                <span
                    v-else-if="typeof resolved.content.icon === 'string'"
                    v-text="resolved.content.icon"
                />
            </span>
        </span>

        <RippleEffect v-if="resolved.interaction.ripple" />
    </component>
</template>
