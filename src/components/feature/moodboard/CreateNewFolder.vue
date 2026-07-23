<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { CircleCheck } from '@lucide/vue';
import ModalOverlay from '@/components/overlay/ModalOverlay.vue';
import Button from '@/components/ui/Button.vue';
import { MOODBOARD_FOLDER_NAME_MAX_LENGTH } from '@/constants/moodboard.constants';
import { graphemeLength } from '@/utils/graphemeLength';

const props = defineProps<{ modelValue: boolean; isSubmitting: boolean; isSuccess: boolean }>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [name: string];
}>();

const folderName = ref('');

const isNameTooLong = computed(
  () => graphemeLength(folderName.value.trim()) > MOODBOARD_FOLDER_NAME_MAX_LENGTH
);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) folderName.value = '';
  }
);

function handleSubmit() {
  if (!folderName.value.trim() || isNameTooLong.value || props.isSubmitting || props.isSuccess)
    return;
  emit('submit', folderName.value.trim());
}
</script>

<template>
  <ModalOverlay :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <template #title>{{ $t('moodboard.createFolderTitle') }}</template>
    <div class="overlay-fields">
      <div class="relative">
        <input
          v-model="folderName"
          class="overlay-input"
          :class="{ 'pr-10': isSuccess, 'input-error-border': isNameTooLong }"
          type="text"
          :placeholder="$t('moodboard.folderNamePlaceholder')"
          :disabled="isSubmitting || isSuccess"
          @keydown.enter="handleSubmit"
        />
        <Transition name="check">
          <CircleCheck
            v-if="isSuccess"
            class="success-icon absolute right-3 top-1/2 -translate-y-1/2 size-5 text-white"
            aria-hidden="true"
          />
        </Transition>
      </div>
      <p v-if="isNameTooLong" class="folder-name-error">
        {{ $t('moodboard.folderNameTooLong', { max: MOODBOARD_FOLDER_NAME_MAX_LENGTH }) }}
      </p>
    </div>
    <div class="overlay-actions">
      <div class="overlay-submit">
        <Button
          variant="primary"
          type="button"
          :disabled="!folderName.trim() || isNameTooLong || isSubmitting || isSuccess"
          @click="handleSubmit"
        >
          {{ $t('moodboard.send') }}
        </Button>
      </div>
    </div>
  </ModalOverlay>
</template>

<style scoped>
.input-error-border {
  border: 1px solid var(--color-stellar-red) !important;
}

.folder-name-error {
  font-family: var(--font-family-body);
  font-size: var(--text-mono);
  color: var(--color-stellar-red);
  margin-top: 6px;
  letter-spacing: 0.05em;
}

.check-enter-active {
  animation: check-in 0.2s ease forwards;
}

@keyframes check-in {
  from {
    opacity: 0;
    transform: translateY(-50%) scale(0.5);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
}

.success-icon :deep(path) {
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
  animation: draw-check 0.4s ease forwards;
}

.success-icon :deep(circle) {
  stroke-dasharray: 63;
  stroke-dashoffset: 63;
  animation: draw-circle 0.4s ease 0.2s forwards;
}

@keyframes draw-check {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes draw-circle {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
