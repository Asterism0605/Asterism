<script setup lang="ts">
import Button from '@/components/ui/Button.vue';

defineProps<{
  pauseLabel: string;
  nextLabel?: string;
}>();

const emit = defineEmits<{
  pause: [];
  next: [];
}>();
</script>

<template>
  <div class="flex w-full items-center justify-between gap-4">
    <Button
      type="button"
      variant="secondary"
      data-testid="user-tour-pause"
      @click="emit('pause')"
    >
      {{ pauseLabel }}
    </Button>
    <Button
      v-if="nextLabel"
      type="button"
      variant="primary"
      data-testid="user-tour-next"
      @click="emit('next')"
    >
      {{ nextLabel }}
    </Button>
  </div>
</template>
