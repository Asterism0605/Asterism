<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import Button from '@/components/ui/Button.vue';
import FormInput from '@/components/ui/FormInput.vue';
import { useAsyncSubmit } from '@/composables/useAsyncSubmit';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const password = ref('');
const { isSubmitting, errorMessage, submit } = useAsyncSubmit();

function handleSubmit() {
  return submit(async () => {
    await authStore.updatePassword(password.value);
    // 更新完成、recovery 憑據已清；replace 避免上一頁又回到 reset 表單。
    router.replace('/');
  }, t('auth.genericError'));
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
      <!-- 沒有 recovery 憑據（連結過期/直接進頁/重整掉狀態）：導回忘記密碼重寄。 -->
      <section
        v-if="!authStore.isPasswordRecovery"
        class="overlay-panel overlay-form glass-panel"
        style="max-width: 640px; padding: 72px 64px 68px"
        role="main"
        :aria-label="$t('auth.resetLinkInvalid')"
      >
        <h2 class="overlay-title">{{ $t('auth.resetLinkExpiredTitle') }}</h2>
        <p class="overlay-subtitle">
          {{ $t('auth.resetLinkExpiredDesc') }}
        </p>
        <div class="overlay-actions">
          <RouterLink :to="{ name: 'forgot-password' }" class="overlay-link">
            {{ $t('auth.requestNewLink') }}
          </RouterLink>
        </div>
      </section>

      <section
        v-else
        class="overlay-panel overlay-form glass-panel"
        style="max-width: 640px; padding: 72px 64px 68px"
        role="main"
        :aria-label="$t('auth.resetPasswordTitle')"
      >
        <h2 class="overlay-title">{{ $t('auth.resetPasswordTitle') }}</h2>
        <p class="overlay-subtitle">{{ $t('auth.resetPasswordDesc') }}</p>

        <form class="overlay-form-body" @submit.prevent="handleSubmit">
          <div class="overlay-fields">
            <FormInput
              v-model="password"
              type="password"
              :placeholder="$t('auth.newPassword')"
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
                {{ isSubmitting ? $t('auth.saving') : $t('auth.updatePassword') }}
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
