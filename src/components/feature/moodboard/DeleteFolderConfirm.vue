<script setup lang="ts">
import { computed } from 'vue';
import ModalOverlay from '@/components/overlay/ModalOverlay.vue';
import Button from '@/components/ui/Button.vue';

const FOLDER_NAME_TITLE_MAX_LENGTH = 10;

const props = defineProps<{ modelValue: boolean; isDeleting: boolean; folderName: string }>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
}>();

const truncatedFolderName = computed(() =>
  props.folderName.length > FOLDER_NAME_TITLE_MAX_LENGTH
    ? `${props.folderName.slice(0, FOLDER_NAME_TITLE_MAX_LENGTH)}...`
    : props.folderName
);
</script>

<template>
  <ModalOverlay :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <template #title>{{ $t('moodboard.deleteFolderTitle', { name: truncatedFolderName }) }}</template>
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
