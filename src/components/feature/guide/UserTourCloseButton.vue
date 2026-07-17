<script setup lang="ts">
import { X } from '@lucide/vue';

defineProps<{
  label: string;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <button
    type="button"
    class="asterism-tour-close cursor-pointer inline-flex size-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-white/8 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-dim/40"
    data-testid="user-tour-close"
    :aria-label="label"
    @click="emit('close')"
  >
    <X class="size-4" aria-hidden="true" />
  </button>
</template>
