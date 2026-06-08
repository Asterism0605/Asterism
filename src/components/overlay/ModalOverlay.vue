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
    <Transition name="modal-overlay">
      <div
        v-if="modelValue"
        class="modal-overlay fixed inset-0 z-50 flex items-center justify-center px-4 py-8 sm:px-6"
        :class="overlayClass"
        role="presentation"
        @click.self="handleBackdropClick"
      >
        <section
          ref="panelRef"
          class="modal-overlay__panel glass-panel relative w-full px-6 py-8 text-center text-text-primary shadow-2xl sm:px-12 sm:py-12"
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
            class="modal-overlay__close absolute right-5 top-5 flex size-9 items-center justify-center rounded-md border border-white/15 p-0 text-text-secondary hover:border-white/30 hover:bg-white/10 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
            type="button"
            aria-label="Close dialog"
            @click="closeModal"
          >
            <span aria-hidden="true">&times;</span>
          </Button>

          <div v-if="$slots.icon" class="mb-6 flex justify-center">
            <slot name="icon" />
          </div>

          <h2 v-if="$slots.title" class="mx-auto text-h1 font-normal">
            <slot name="title" />
          </h2>

          <p
            v-if="$slots.description"
            class="text-body mx-auto mt-6 leading-normal text-text-primary/75"
          >
            <slot name="description" />
          </p>

          <div v-if="$slots.default" class="mt-8">
            <slot />
          </div>

          <div v-if="$slots.actions" class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <slot name="actions" />
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  background:
    radial-gradient(circle at center, rgb(240 237 230 / 0.12), transparent 38%),
    linear-gradient(180deg, rgb(6 6 8 / 0.84), rgb(6 6 8 / 0.94));
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.modal-overlay__panel {
  border-radius: 48px;
  transform-origin: center;
}

.modal-overlay__close {
  font-size: 1.5rem;
  line-height: 1;
}

.modal-overlay-enter-active,
.modal-overlay-leave-active {
  transition: opacity 240ms ease;
}

.modal-overlay-enter-active .modal-overlay__panel,
.modal-overlay-leave-active .modal-overlay__panel {
  transition:
    opacity 240ms ease,
    transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.modal-overlay-enter-from,
.modal-overlay-leave-to {
  opacity: 0;
}

.modal-overlay-enter-from .modal-overlay__panel,
.modal-overlay-leave-to .modal-overlay__panel {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}

@media (max-width: 640px) {
  .modal-overlay__panel {
    border-radius: 32px;
  }
}
</style>
