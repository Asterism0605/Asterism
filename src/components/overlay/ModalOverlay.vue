<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import Button from '@/components/ui/Button.vue';

interface Props {
  modelValue: boolean;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  panelClass?: string;
  overlayClass?: string;
  maxWidth?: string;
}

const props = withDefaults(defineProps<Props>(), {
  closeOnBackdrop: true,
  closeOnEsc: true,
  showCloseButton: false,
  panelClass: '',
  overlayClass: '',
  maxWidth: '520px'
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
}>();

const panelRef = ref<HTMLElement | null>(null);
const previousActiveElement = ref<HTMLElement | null>(null);
let previousBodyOverflow = '';

const panelStyle = computed(() => ({
  maxWidth: props.maxWidth
}));

function getPanelElement() {
  return panelRef.value;
}

function closeModal() {
  emit('update:modelValue', false);
  emit('close');
}

function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    closeModal();
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.modelValue) {
    return;
  }

  if (event.key === 'Escape' && props.closeOnEsc) {
    event.preventDefault();
    closeModal();
    return;
  }

  const panelElement = getPanelElement();

  if (event.key !== 'Tab' || !panelElement) {
    return;
  }

  const focusableElements = panelElement.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  if (!focusableElements.length) {
    event.preventDefault();
    panelElement.focus();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

async function focusPanel() {
  await nextTick();
  getPanelElement()?.focus();
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    if (isOpen) {
      previousActiveElement.value = document.activeElement as HTMLElement | null;
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeydown);
      void focusPanel();
      return;
    }

    document.body.style.overflow = previousBodyOverflow;
    window.removeEventListener('keydown', handleKeydown);
    previousActiveElement.value?.focus();
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  document.body.style.overflow = previousBodyOverflow;
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div
        v-if="modelValue"
        class="overlay-backdrop"
        :class="overlayClass"
        role="presentation"
        @click.self="handleBackdropClick"
      >
        <section
          ref="panelRef"
          class="overlay-panel glass-panel"
          :class="panelClass"
          :style="panelStyle"
          role="dialog"
          aria-modal="true"
          tabindex="-1"
          @click.stop
        >
          <Button
            v-if="showCloseButton"
            variant="secondary"
            class="overlay-close"
            type="button"
            aria-label="Close dialog"
            @click="closeModal"
          >
            <span aria-hidden="true">&times;</span>
          </Button>

          <div v-if="$slots.icon" class="mb-6 flex justify-center">
            <slot name="icon" />
          </div>

          <h2 v-if="$slots.title" class="overlay-title">
            <slot name="title" />
          </h2>

          <p
            v-if="$slots.description"
            class="overlay-description"
          >
            <slot name="description" />
          </p>

          <div v-if="$slots.default" class="mt-8">
            <slot />
          </div>

          <div v-if="$slots.actions" class="overlay-actions overlay-actions--stackable">
            <slot name="actions" />
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

