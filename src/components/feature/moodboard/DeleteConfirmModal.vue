<script setup lang="ts">
import ModalOverlay from '@/components/overlay/ModalOverlay.vue';
import Button from '@/components/ui/Button.vue';

defineProps<{
  modelValue: boolean;
  isDeleting: boolean;
  titleKey: string;
  titleParams?: Record<string, unknown>;
  confirmTestId: string;
  cancelTestId: string;
}>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
}>();
</script>

<template>
  <ModalOverlay :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <template #title>{{ $t(titleKey, titleParams ?? {}) }}</template>
    <template #actions>
      <Button
        variant="primary"
        type="button"
        :data-testid="confirmTestId"
        :disabled="isDeleting"
        @click="emit('confirm')"
      >
        {{ $t('moodboard.deleteConfirm') }}
      </Button>
      <Button
        variant="secondary"
        type="button"
        :data-testid="cancelTestId"
        :disabled="isDeleting"
        @click="emit('update:modelValue', false)"
      >
        {{ $t('moodboard.deleteCancel') }}
      </Button>
    </template>
  </ModalOverlay>
</template>
