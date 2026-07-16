<script setup lang="ts">
import DeleteConfirmModal from './DeleteConfirmModal.vue';

defineProps<{ modelValue: boolean; isDeleting: boolean }>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
}>();
</script>

<template>
  <DeleteConfirmModal
    :model-value="modelValue"
    :is-deleting="isDeleting"
    title-key="moodboard.deleteImageTitle"
    confirm-test-id="delete-image-confirm"
    cancel-test-id="delete-image-cancel"
    @update:model-value="emit('update:modelValue', $event)"
    @confirm="emit('confirm')"
  />
</template>
