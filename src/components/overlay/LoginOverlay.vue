<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import Button from '@/components/ui/Button.vue';

interface Props {
  modelValue: boolean;
}

interface LoginPayload {
  email: string;
  password: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [payload: LoginPayload];
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
    <Transition name="login-overlay">
      <div
        v-if="modelValue"
        class="login-overlay fixed inset-0 z-50 flex items-center justify-center px-4 py-8 sm:px-6"
        role="presentation"
        @click.self="handleBackdropClick"
      >
        <section
          ref="panelRef"
          class="login-card glass-panel relative w-full text-center"
          role="dialog"
          aria-modal="true"
          aria-label="Login"
          tabindex="-1"
          @click.stop
        >
          <h2 class="login-card__title">Login</h2>

          <div class="login-card__fields">
            <input
              v-model="email"
              type="email"
              class="login-card__input"
              placeholder="EMAIL"
              autocomplete="email"
            />
            <input
              v-model="password"
              type="password"
              class="login-card__input"
              placeholder="PASSWORD"
              autocomplete="current-password"
              @keydown.enter="handleSubmit"
            />
            <div class="login-card__helper">
              <button type="button" class="login-card__forgot-btn">FORGOT PASSWORD?</button>
            </div>
          </div>

          <div class="login-card__actions">
            <span class="login-card__submit-wrap">
              <Button variant="secondary" type="button" @click="handleSubmit">SEND</Button>
            </span>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.login-overlay {
  background:
    radial-gradient(circle at center, rgb(240 237 230 / 0.12), transparent 38%),
    linear-gradient(180deg, rgb(6 6 8 / 0.84), rgb(6 6 8 / 0.94));
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.login-card {
  max-width: 520px;
  padding: 56px 48px 52px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.login-card__title {
  font-family: var(--font-family-title);
  font-size: var(--text-h1);
  font-weight: 300;
  color: var(--color-text-primary);
  letter-spacing: 0.01em;
  margin-bottom: 36px;
}

.login-card__fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 40px;
}

.login-card__input {
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

.login-card__input::placeholder {
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.login-card__input:focus {
  background: rgba(255, 255, 255, 0.11);
}

.login-card__actions {
  display: flex;
  justify-content: center;
}

.login-card__submit-wrap :deep(button) {
  background: var(--color-text-secondary);
  color: var(--color-deep);
  border: none;
  padding-left: 48px;
  padding-right: 48px;
  letter-spacing: 0.1em;
}

.login-card__submit-wrap :deep(button:hover) {
  background: var(--color-text-secondary);
  opacity: 0.85;
}

.login-overlay-enter-active,
.login-overlay-leave-active {
  transition: opacity 240ms ease;
}

.login-overlay-enter-active .login-card,
.login-overlay-leave-active .login-card {
  transition:
    opacity 240ms ease,
    transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.login-overlay-enter-from,
.login-overlay-leave-to {
  opacity: 0;
}

.login-overlay-enter-from .login-card,
.login-overlay-leave-to .login-card {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}

.login-card__helper {
  display: flex;
  justify-content: flex-start;
  margin-top: 4px;
}

.login-card__forgot-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-family: var(--font-family-body);
  font-size: var(--text-caption);
  letter-spacing: 0.05em;
  cursor: pointer;
  padding: 4px 0;
  transition: color 200ms ease;
}

.login-card__forgot-btn:hover {
  color: var(--color-text-primary);
  text-decoration: underline;
}

@media (max-width: 640px) {
  .login-card {
    padding: 48px 32px 40px;
    border-radius: 16px;
  }
}
</style>
