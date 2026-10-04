<script setup lang="ts">
import type { ShellExecLine } from '@/core/entities'

defineProps<{
    lines: ShellExecLine[]
}>()
</script>

<template>
    <div class="shell-terminal">
        <pre class="shell-terminal__body"><template v-for="(line, i) in lines" :key="i"><span
            :class="line.stream === 'stderr' ? 'shell-terminal__stderr' : 'shell-terminal__stdout'">{{ line.text }}</span></template></pre>
    </div>
</template>

<style scoped>
.shell-terminal {
    background: #0b0e14;
    border: 1px solid #1f2630;
    border-radius: 6px;
    padding: 8px 10px;
    margin-top: 6px;
    overflow: auto;
    max-height: 320px;
}

.shell-terminal__body {
    margin: 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
}

.shell-terminal__stdout {
    color: #d7dce5;
}

.shell-terminal__stderr {
    color: #ff8a8a;
}
</style>
