<script setup lang="ts">
import Button from '@/components/ui/Button.vue';

defineProps<{
  email: string;
  resendMessage: string;
  countdown: number;
}>();

defineEmits<{ resend: [] }>();
</script>

<template>
  <section
    class="overlay-panel overlay-panel--wide glass-panel"
    data-testid="verification-sent"
    role="main"
    aria-label="Verification email sent"
  >
    <h2 class="overlay-title">Check your email</h2>
    <p class="overlay-description">
      We sent a verification link to <strong>{{ email }}</strong>.
      <span class="verification-sent__detail">
        Open it to activate your account and finish signing up.
      </span>
    </p>

    <p class="overlay-description verification-sent__hint">
      Didn't get it? Check your spam folder, or resend below.
    </p>

    <div class="overlay-actions overlay-actions--stackable">
      <span class="overlay-submit">
        <Button
          variant="secondary"
          type="button"
          data-testid="resend-button"
          :disabled="countdown > 0"
          @click="$emit('resend')"
        >
          {{ countdown > 0 ? `RESEND IN ${countdown}S` : 'RESEND EMAIL' }}
        </Button>
      </span>
      <RouterLink :to="{ name: 'login' }" class="overlay-link">Back to login</RouterLink>
    </div>

    <p
      v-if="resendMessage"
      class="overlay-description verification-sent__status"
      role="status"
      data-testid="resend-message"
    >
      {{ resendMessage }}
    </p>
  </section>
</template>

<style scoped>
.verification-sent__detail {
  display: block;
  margin-top: 0.5rem;
}

.verification-sent__hint {
  margin-top: 1.25rem;
  font-size: 14px;
}

.verification-sent__status {
  margin-top: 1rem;
  font-size: 13px;
}
</style>
