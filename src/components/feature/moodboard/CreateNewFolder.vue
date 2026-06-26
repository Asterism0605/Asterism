<script setup lang="ts">
import { ref, watch } from 'vue';
import { CircleCheck, LoaderCircle } from '@lucide/vue';
import ModalOverlay from '@/components/overlay/ModalOverlay.vue';
import Button from '@/components/ui/Button.vue';
import { createFolder } from '@/services/moodboard.service';
import { showToast } from '@/composables/useToast';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

const folderName = ref('');
const isSubmitting = ref(false);
const isSuccess = ref(false);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      folderName.value = '';
      isSuccess.value = false;
    }
  }
);

async function handleSubmit() {
  if (!folderName.value.trim() || isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    await createFolder(folderName.value.trim());
    isSuccess.value = true;
    await new Promise((resolve) => setTimeout(resolve, 800));
    emit('update:modelValue', false);
  } catch {
    showToast({ type: 'error', message: 'Failed to create folder. Please try again.' });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <ModalOverlay :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <template #title>CREATE NEW FOLDER</template>
    <div class="overlay-fields">
      <div class="relative">
        <input
          v-model="folderName"
          class="overlay-input"
          :class="{ 'pr-10': isSuccess }"
          type="text"
          placeholder="Folder name"
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
    </div>
    <div class="overlay-actions">
      <div class="overlay-submit">
        <Button
          variant="primary"
          type="button"
          :disabled="!folderName.trim() || isSubmitting || isSuccess"
          @click="handleSubmit"
        >
          <span class="inline-flex items-center gap-2">
            <LoaderCircle v-if="isSubmitting" class="size-4 animate-spin" aria-hidden="true" />
            SEND
          </span>
        </Button>
      </div>
    </div>
  </ModalOverlay>
</template>

<style scoped>
.check-enter-active {
  animation: check-in 0.2s ease forwards;
}

@keyframes check-in {
  from { opacity: 0; transform: translateY(-50%) scale(0.5); }
  to   { opacity: 1; transform: translateY(-50%) scale(1); }
}

.success-icon :deep(path) {
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
  animation: draw-check 0.25s ease forwards;
}

.success-icon :deep(circle) {
  stroke-dasharray: 63;
  stroke-dashoffset: 63;
  animation: draw-circle 0.4s ease 0.2s forwards;
}

@keyframes draw-check {
  to { stroke-dashoffset: 0; }
}

@keyframes draw-circle {
  to { stroke-dashoffset: 0; }
}
</style>
