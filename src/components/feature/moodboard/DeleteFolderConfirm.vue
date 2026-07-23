<script setup lang="ts">
import { computed } from 'vue';
import DeleteConfirmModal from './DeleteConfirmModal.vue';

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
  <DeleteConfirmModal
    :model-value="modelValue"
    :is-deleting="isDeleting"
    title-key="moodboard.deleteFolderTitle"
    :title-params="{ name: truncatedFolderName }"
    confirm-test-id="delete-folder-confirm"
    cancel-test-id="delete-folder-cancel"
    @update:model-value="emit('update:modelValue', $event)"
    @confirm="emit('confirm')"
  />
</template>
