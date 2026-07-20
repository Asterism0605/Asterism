<script setup lang="ts">
defineProps<{
  selected: boolean;
  ariaLabel: string;
}>();

const emit = defineEmits<{
  toggle: [];
}>();
</script>

<template>
  <button
    type="button"
    class="image-select-toggle"
    :class="{ 'image-select-toggle--selected': selected }"
    :aria-pressed="selected"
    :aria-label="ariaLabel"
    @pointerdown.stop
    @click.stop="emit('toggle')"
  />
</template>

<style scoped>
.image-select-toggle {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(240, 237, 230, 0.85);
  border-radius: 50%;
  padding: 0;
  background: rgba(9, 9, 11, 0.35);
  backdrop-filter: blur(4px);
  transition:
    background-color 180ms ease,
    box-shadow 180ms ease;
}

.image-select-toggle--selected {
  background: var(--color-text-primary);
  box-shadow:
    0 0 0 1px #f0ede68c,
    0 0 10px #f0ede657;
}
</style>
