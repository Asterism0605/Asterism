<script setup lang="ts">
defineProps<{
  colors: string[]
}>()
</script>

<template>
  <div class="p-4 bg-elevated rounded">
    <p class="text-caption font-mono text-text-secondary mb-2">color palette</p>
    <div v-if="colors.length" class="flex h-16 rounded overflow-hidden">
      <div
        v-for="(color, i) in colors"
        :key="`${i}-${color}`"
        data-testid="color-block"
        class="flex-1"
        :style="{ backgroundColor: color }"
      />
    </div>
  </div>
</template>
