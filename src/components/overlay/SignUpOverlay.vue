<script setup lang="ts">
import { ref } from 'vue';
import Button from '@/components/ui/Button.vue';
import FormInput from '@/components/ui/FormInput.vue';

interface SignUpPayload {
  email: string;
  password: string;
}

const emit = defineEmits<{
  submit: [payload: SignUpPayload];
}>();

withDefaults(
  defineProps<{
    isSubmitting?: boolean;
    errorMessage?: string;
  }>(),
  {
    isSubmitting: false,
    errorMessage: ''
  }
);

const email = ref('');
const password = ref('');

function handleSubmit() {
  emit('submit', { email: email.value, password: password.value });
}
</script>

<template>
  <section
    class="overlay-panel overlay-form glass-panel"
    style="max-width: 640px; padding: 72px 64px 68px"
    role="main"
    aria-label="Sign up"
  >
    <h2 class="overlay-title">Sign up</h2>
    <p class="overlay-subtitle">Sign up to start building your Style DNA.</p>

    <form class="overlay-form-body" @submit.prevent="handleSubmit">
      <div class="overlay-fields">
        <FormInput v-model="email" type="email" placeholder="EMAIL" autocomplete="email" />
        <FormInput
          v-model="password"
          type="password"
          placeholder="PASSWORD"
          autocomplete="new-password"
        />
      </div>

      <p v-if="errorMessage" class="overlay-error" data-testid="auth-error" role="alert">
        {{ errorMessage }}
      </p>

      <div class="overlay-actions">
        <span class="overlay-submit">
          <Button
            variant="secondary"
            type="submit"
            data-testid="auth-submit"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'SENDING…' : 'SEND' }}
          </Button>
        </span>
      </div>
    </form>
  </section>
</template>

<style scoped>
/* form 只為語意/把密碼欄包進表單（消除 Chrome 警告），不影響 flex 版面 */
.overlay-form-body {
  display: contents;
}

@media (max-width: 640px) {
  .overlay-title {
    font-size: 24px;
    margin-bottom: 24px;
  }

  .overlay-fields {
    gap: 12px;
  }
}

.overlay-subtitle {
  margin-top: 10px;
  /* 與下方 input 拉開約 1rem 間距（review #2） */
  margin-bottom: 1rem;
  font-family: var(--font-family-body);
  font-size: var(--text-mono);
  color: var(--color-text-secondary);
  letter-spacing: 0.05em;
}

.overlay-error {
  margin-top: 14px;
  /* 與下方按鈕拉開約 1rem 間距（review #4） */
  margin-bottom: 1rem;
  font-family: var(--font-family-body);
  font-size: var(--text-mono);
  color: var(--color-stellar-red);
  letter-spacing: 0.05em;
}
</style>
