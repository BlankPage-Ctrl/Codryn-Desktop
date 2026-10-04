<script setup lang="ts">
import { computed } from 'vue'
import type { IconRailsSchema } from './types.ts'
import IconRailsItem from './components/IconRailsItem.vue'

defineOptions({ name: 'IconRails' })

type Props = {
    schema: IconRailsSchema
}

const props = defineProps<Props>()

const rootClass = computed(() =>
    [
        'ir-root',
        props.schema.vertical === false ? 'ir-root--horizontal' : '',
        `ir-root--${props.schema.size ?? 'md'}`,
        props.schema.class ?? '',
    ]
        .filter(Boolean)
        .join(' '),
)
</script>

<style src="./styles/index.css"></style>

<template>
    <div :class="rootClass">
        <IconRailsItem
            v-for="item in schema.items"
            :key="item.id"
            :item="item"
            :size="schema.size ?? 'md'"
        />
    </div>
</template>
