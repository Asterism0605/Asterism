<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import Button from '@/components/ui/Button.vue';
import FormInput from '@/components/ui/FormInput.vue';
import { useAuthStore } from '@/stores/auth.store';
import { getErrorMessage } from '@/utils/api-error';

const router = useRouter();
const authStore = useAuthStore();

const password = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');

async function handleSubmit() {
  if (isSubmitting.value) {
    return;
  }
  isSubmitting.value = true;
  errorMessage.value = '';
  try {
    await authStore.updatePassword(password.value);
    // recovery session 已登入，更新完成直接進首頁。
    router.push('/');
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Something went wrong. Please try again.');
  } finally {
    isSubmitting.value = false;
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
      <!-- 沒有 recovery session（連結過期/直接進頁）：導回忘記密碼重寄。 -->
      <section
        v-if="!authStore.isAuthenticated"
        class="overlay-panel overlay-form glass-panel"
        style="max-width: 640px; padding: 72px 64px 68px"
        role="main"
        aria-label="Reset link invalid"
      >
        <h2 class="overlay-title">Link expired</h2>
        <p class="overlay-subtitle">
          This reset link is invalid or has expired. Please request a new one.
        </p>
        <div class="overlay-actions">
          <RouterLink :to="{ name: 'forgot-password' }" class="overlay-link">
            Request new link
          </RouterLink>
        </div>
      </section>

      <section
        v-else
        class="overlay-panel overlay-form glass-panel"
        style="max-width: 640px; padding: 72px 64px 68px"
        role="main"
        aria-label="Reset password"
      >
        <h2 class="overlay-title">Set new password</h2>
        <p class="overlay-subtitle">Choose a new password for your account.</p>

        <form class="overlay-form-body" @submit.prevent="handleSubmit">
          <div class="overlay-fields">
            <FormInput
              v-model="password"
              type="password"
              placeholder="NEW PASSWORD"
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
                {{ isSubmitting ? 'SAVING…' : 'UPDATE PASSWORD' }}
              </Button>
            </span>
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
