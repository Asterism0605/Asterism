<script setup lang="ts">
import { ref } from 'vue';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import VerificationSentOverlay from '@/components/overlay/VerificationSentOverlay.vue';
import Button from '@/components/ui/Button.vue';
import FormInput from '@/components/ui/FormInput.vue';
import { useAsyncSubmit } from '@/composables/useAsyncSubmit';
import { useCountdown } from '@/composables/useCountdown';
import { useAuthStore } from '@/stores/auth.store';
import { getErrorMessage } from '@/utils/api-error';

const authStore = useAuthStore();

const email = ref('');
const { isSubmitting, errorMessage, submit } = useAsyncSubmit();
// 送出成功後存收件信箱，切換為「請至信箱收信」引導畫面。
const sentToEmail = ref('');

// 重寄：cooldown 對齊 Supabase SMTP Minimum interval（60s），避免狂點吃 rate-limit。
const resendMessage = ref('');
const { countdown: resendCountdown, start: startCooldown } = useCountdown(60);

function handleSubmit() {
  return submit(async () => {
    await authStore.requestPasswordReset(email.value);
    sentToEmail.value = email.value;
    // 第一封已寄出＝已佔用 60s rate-limit 窗，先起跑 cooldown。
    startCooldown();
  }, 'Something went wrong. Please try again.');
}

// 重寄走獨立訊息欄（resendMessage，成功也要顯示）＋ cooldown 擋重點，
// 不吃 isSubmitting，所以維持自己的 try/catch。
async function handleResend() {
  resendMessage.value = '';
  try {
    await authStore.requestPasswordReset(sentToEmail.value);
    resendMessage.value = 'Reset email resent.';
    startCooldown();
  } catch (error) {
    resendMessage.value = getErrorMessage(error, "Couldn't resend right now. Please try again.");
  }
}
</script>

<template>
  <main
    class="relative min-h-screen overflow-hidden bg-void text-text-primary [--app-header-height:60px]"
  >
    <div
      class="fixed inset-0 z-10"
      style="
        background:
          radial-gradient(circle at center, rgb(240 237 230 / 0.12), transparent 38%),
          linear-gradient(180deg, rgb(6 6 8 / 0.84), rgb(6 6 8 / 0.94));
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
      "
      aria-hidden="true"
    />

    <div class="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
      <div class="absolute top-[39%] left-[74%] -translate-x-1/2 -translate-y-1/2">
        <ConstellationBackground
          :size="580"
          class-name="constellation-pulse"
          :node-size="6"
          :center-size="12"
          :spacing="50"
          :line-length="250"
          :line-width="1.2"
          :line-opacity="0.35"
          :active-node-opacity="0.45"
          :inactive-node-opacity="0.1"
          :intensity="0.5"
        />
      </div>
      <div class="absolute top-[89%] left-[10%] -translate-x-1/2 -translate-y-1/2">
        <ConstellationBackground
          :size="560"
          class-name="constellation-pulse"
          :node-size="6"
          :center-size="12"
          :spacing="48"
          :line-length="240"
          :line-width="1.2"
          :line-opacity="0.3"
          :active-node-opacity="0.4"
          :inactive-node-opacity="0.08"
          :intensity="0.45"
        />
      </div>
    </div>

    <div
      class="relative z-30 flex min-h-screen items-center justify-center px-4 pt-(--app-header-height)"
    >
      <VerificationSentOverlay
        v-if="sentToEmail"
        :email="sentToEmail"
        :resend-message="resendMessage"
        :countdown="resendCountdown"
        title="Check your email"
        lead-text="We sent a password reset link to"
        detail-text="Open it to choose a new password."
        @resend="handleResend"
      />
      <section
        v-else
        class="overlay-panel overlay-form glass-panel"
        style="max-width: 640px; padding: 72px 64px 68px"
        role="main"
        aria-label="Forgot password"
      >
        <h2 class="overlay-title">Forgot password</h2>
        <p class="overlay-subtitle">Enter your email and we'll send you a reset link.</p>

        <form class="overlay-form-body" @submit.prevent="handleSubmit">
          <div class="overlay-fields">
            <FormInput v-model="email" type="email" placeholder="EMAIL" autocomplete="email" />
          </div>

          <p v-if="errorMessage" class="overlay-error" data-testid="auth-error" role="alert">
            {{ errorMessage }}
          </p>

          <div class="overlay-actions overlay-actions--stackable">
            <span class="overlay-submit">
              <Button
                variant="secondary"
                type="submit"
                data-testid="auth-submit"
                :disabled="isSubmitting"
              >
                {{ isSubmitting ? 'SENDING…' : 'SEND RESET LINK' }}
              </Button>
            </span>
            <RouterLink :to="{ name: 'login' }" class="overlay-link">Back to login</RouterLink>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<style scoped>
.overlay-form-body {
  display: contents;
}

.overlay-subtitle {
  margin-top: 10px;
  margin-bottom: 1rem;
  font-family: var(--font-family-body);
  font-size: var(--text-mono);
  color: var(--color-text-secondary);
  letter-spacing: 0.05em;
}

.overlay-error {
  margin-top: 14px;
  margin-bottom: 1rem;
  font-family: var(--font-family-body);
  font-size: var(--text-mono);
  color: var(--color-stellar-red);
  letter-spacing: 0.05em;
}

@media (max-width: 640px) {
  .overlay-title {
    font-size: 24px;
    margin-bottom: 24px;
  }
}
</style>
