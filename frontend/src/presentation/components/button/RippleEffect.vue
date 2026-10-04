<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const ink = ref<HTMLSpanElement>()
const animating = ref(false)

function onClick(e: MouseEvent) {
    if (!ink.value) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2

    ink.value.style.width = `${size}px`
    ink.value.style.height = `${size}px`
    ink.value.style.left = `${x}px`
    ink.value.style.top = `${y}px`
    animating.value = true
}

let el: HTMLElement | null = null

onMounted(() => {
    el = ink.value?.parentElement ?? null
    el?.addEventListener('click', onClick)
})

onUnmounted(() => {
    el?.removeEventListener('click', onClick)
})
</script>

<template>
    <span
        ref="ink"
        class="btn__ripple"
        :class="{ 'btn__ripple--active': animating }"
        @animationend="animating = false"
    />
</template>
