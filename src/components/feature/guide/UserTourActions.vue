<script setup lang="ts">
import Button from '@/components/ui/Button.vue';

defineProps<{
  previousLabel?: string;
  nextLabel?: string;
}>();

const emit = defineEmits<{
  previous: [];
  next: [];
}>();
</script>

<template>
  <div class="flex w-full items-center justify-between gap-4">
    <Button
      v-if="previousLabel"
      type="button"
      variant="secondary"
      data-testid="user-tour-previous"
      @click="emit('previous')"
    >
      {{ previousLabel }}
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
