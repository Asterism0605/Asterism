<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  colors: string[];
}>();

const hoveredIndex = ref<number | null>(null);
</script>

<template>
  <div class="flex flex-col gap-4 p-4 bg-elevated rounded">
    <h2 class="zh-heading-spacing text-h3 text-text-primary">{{ $t('common.colorPalette') }}</h2>
    <div v-if="colors.length" class="flex h-10 rounded overflow-hidden">
      <div
        v-for="(color, i) in colors"
        :key="`${i}-${color}`"
        data-testid="color-block"
        class="relative flex-1"
        :style="{ backgroundColor: color }"
        @mouseenter="hoveredIndex = i"
        @mouseleave="hoveredIndex = null"
      >
        <span
          v-if="hoveredIndex === i"
          class="absolute inset-0 flex items-center justify-center bg-black/40 font-mono text-xs text-white backdrop-blur-[1px]"
        >
          {{ color }}
        </span>
      </div>
    </div>
  </div>
</template>
