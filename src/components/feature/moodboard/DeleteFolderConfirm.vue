<script setup lang="ts">
import ModalOverlay from '@/components/overlay/ModalOverlay.vue';
import Button from '@/components/ui/Button.vue';

defineProps<{ modelValue: boolean; isDeleting: boolean }>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
}>();
</script>

<template>
  <ModalOverlay :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <template #title>{{ $t('moodboard.deleteFolderTitle') }}</template>
    <template #actions>
      <Button
        variant="primary"
        type="button"
        data-testid="delete-folder-confirm"
        :disabled="isDeleting"
        @click="emit('confirm')"
      >
        {{ $t('moodboard.deleteConfirm') }}
      </Button>
      <Button
        variant="secondary"
        type="button"
        data-testid="delete-folder-cancel"
        :disabled="isDeleting"
        @click="emit('update:modelValue', false)"
      >
        {{ $t('moodboard.deleteCancel') }}
      </Button>
    </template>
  </ModalOverlay>
</template>
