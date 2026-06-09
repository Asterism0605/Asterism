<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import Button from '@/components/ui/Button.vue';

interface Props {
  modelValue: boolean;
}

interface SignUpPayload {
  email: string;
  password: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [payload: SignUpPayload];
}>();

const panelRef = ref<HTMLElement | null>(null);
const previousActiveElement = ref<HTMLElement | null>(null);
let previousBodyOverflow = '';

const email = ref('');
const password = ref('');

function closeModal() {
  emit('update:modelValue', false);
}

function handleBackdropClick() {
  closeModal();
}

function handleSubmit() {
  emit('submit', { email: email.value, password: password.value });
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.modelValue) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    closeModal();
    return;
  }

  const panelElement = panelRef.value;
  if (event.key !== 'Tab' || !panelElement) return;

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
  panelRef.value?.focus();
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

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
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  document.body.style.overflow = previousBodyOverflow;
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="signup-overlay">
      <div
        v-if="modelValue"
        class="signup-overlay fixed inset-0 z-50 flex items-center justify-center px-4 py-8 sm:px-6"
        role="presentation"
        @click.self="handleBackdropClick"
      >
        <section
          ref="panelRef"
          class="signup-card glass-panel relative w-full text-center"
          role="dialog"
          aria-modal="true"
          aria-label="Sign up"
          tabindex="-1"
          @click.stop
        >
          <h2 class="signup-card__title">Sign up</h2>

          <div class="signup-card__fields">
            <input
              v-model="email"
              type="email"
              class="signup-card__input"
              placeholder="EMAIL"
              autocomplete="email"
            />
            <input
              v-model="password"
              type="password"
              class="signup-card__input"
              placeholder="PASSWORD"
              autocomplete="new-password"
              @keydown.enter="handleSubmit"
            />
          </div>

          <div class="signup-card__actions">
            <span class="signup-card__submit-wrap">
              <Button variant="secondary" type="button" @click="handleSubmit">SEND</Button>
            </span>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.signup-overlay {
  background:
    radial-gradient(circle at center, rgb(240 237 230 / 0.12), transparent 38%),
    linear-gradient(180deg, rgb(6 6 8 / 0.84), rgb(6 6 8 / 0.94));
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.signup-card {
  max-width: 520px;
  padding: 56px 48px 52px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.signup-card__title {
  font-family: var(--font-family-title);
  font-size: var(--text-h1);
  font-weight: 300;
  color: var(--color-text-primary);
  letter-spacing: 0.01em;
  margin-bottom: 36px;
}

.signup-card__fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 40px;
}

.signup-card__input {
  width: 100%;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  border: none;
  padding: 14px 20px;
  font-family: var(--font-family-body);
  font-size: var(--text-caption);
  font-weight: 500;
  letter-spacing: 0.1em;
  color: var(--color-text-primary);
  outline: none;
  transition: background 200ms ease;
}

.signup-card__input::placeholder {
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.signup-card__input:focus {
  background: rgba(255, 255, 255, 0.11);
}

.signup-card__actions {
  display: flex;
  justify-content: center;
}

.signup-card__submit-wrap :deep(button) {
  background: var(--color-text-secondary);
  color: var(--color-deep);
  border: none;
  padding-left: 48px;
  padding-right: 48px;
  letter-spacing: 0.1em;
}

.signup-card__submit-wrap :deep(button:hover) {
  background: var(--color-text-secondary);
  opacity: 0.85;
}

.signup-overlay-enter-active,
.signup-overlay-leave-active {
  transition: opacity 240ms ease;
}

.signup-overlay-enter-active .signup-card,
.signup-overlay-leave-active .signup-card {
  transition:
    opacity 240ms ease,
    transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.signup-overlay-enter-from,
.signup-overlay-leave-to {
  opacity: 0;
}

.signup-overlay-enter-from .signup-card,
.signup-overlay-leave-to .signup-card {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}

@media (max-width: 640px) {
  .signup-card {
    padding: 48px 32px 40px;
    border-radius: 16px;
  }
}
</style>
