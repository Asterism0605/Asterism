<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import Button from '@/components/ui/Button.vue';
import FormInput from '@/components/ui/FormInput.vue';

interface Props {
  modelValue?: boolean;
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

function handleSubmit() {
  emit('submit', { email: email.value, password: password.value });
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.modelValue) return;

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
    <Transition name="overlay">
      <div v-if="modelValue" class="overlay-backdrop" role="presentation">
        <section
          ref="panelRef"
          class="overlay-panel overlay-form glass-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Sign up"
          tabindex="-1"
          @click.stop
        >
          <h2 class="overlay-title">Sign up</h2>

          <div class="overlay-fields">
            <FormInput v-model="email" type="email" placeholder="EMAIL" autocomplete="email" />
            <FormInput
              v-model="password"
              type="password"
              placeholder="PASSWORD"
              autocomplete="new-password"
            />
          </div>

          <div class="overlay-actions">
            <span class="overlay-submit">
              <Button variant="secondary" type="button" @click="handleSubmit">SEND</Button>
            </span>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@media (max-width: 640px) {
  .overlay-title {
    font-size: 24px;
    margin-bottom: 24px;
  }

  .overlay-fields {
    gap: 12px;
  }
}
</style>
