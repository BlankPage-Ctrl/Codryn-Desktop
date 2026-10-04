<script setup lang="ts">
import type { ThemedToken } from 'shiki'

defineProps<{ lines: ThemedToken[][]; lineNumbers: number[] }>()
</script>

<template>
    <span v-for="(line, lineIndex) in lines" :key="lineIndex" class="code-renderer__line">
        <span class="code-renderer__gutter">{{ lineNumbers[lineIndex] ?? lineIndex + 1 }}</span>
        <span class="code-renderer__content"
            ><span
                v-for="(token, tokenIndex) in line"
                :key="tokenIndex"
                :style="token.color ? { color: token.color } : undefined"
                >{{ token.content }}</span
            ><template v-if="line.length === 0">&#8203;</template></span
        >
    </span>
</template>
