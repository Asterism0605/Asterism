<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import SignUpOverlay from '@/components/overlay/SignUpOverlay.vue';
import { useAuthStore } from '@/stores/auth.store';
import { getSafeRedirectPath } from '@/utils/redirect';
import { getErrorCode, getErrorMessage } from '@/utils/api-error';
import type { RegisterPayload } from '@/types/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isSubmitting = ref(false);
const errorMessage = ref('');
// 開啟 Confirm email 時，註冊不回 session 而是寄驗證信；存收件信箱以顯示「驗證信已寄出」引導畫面。
const sentToEmail = ref('');

async function handleSubmit(payload: RegisterPayload) {
  if (isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    await authStore.register(payload);
    router.push(getSafeRedirectPath(route.query.next, '/discover-dna'));
  } catch (error) {
    // 已開信箱驗證：非錯誤，轉成正向「請至信箱收信」引導畫面。
    if (getErrorCode(error) === 'EMAIL_CONFIRMATION_REQUIRED') {
      sentToEmail.value = payload.email;
    } else {
      errorMessage.value = getErrorMessage(error, 'Something went wrong. Please try again.');
    }
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
      <div class="absolute top-[22%] left-[20%] -translate-x-1/2 -translate-y-1/2">
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
      <div class="absolute top-[80%] left-[88%] -translate-x-1/2 -translate-y-1/2">
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

    <!-- 卡片 -->
    <div
      class="relative z-30 flex min-h-screen items-center justify-center px-4 pt-(--app-header-height)"
    >
      <section
        v-if="sentToEmail"
        class="overlay-panel glass-panel"
        style="max-width: 640px; padding: 72px 64px 68px"
        data-testid="verification-sent"
        role="main"
        aria-label="Verification email sent"
      >
        <h2 class="overlay-title">Check your email</h2>
        <p class="overlay-description">
          We sent a verification link to <strong>{{ sentToEmail }}</strong
          >. Open it to activate your account and finish signing up.
        </p>
        <div class="overlay-actions overlay-actions--stackable">
          <RouterLink :to="{ name: 'login' }" class="overlay-link">Back to login</RouterLink>
        </div>
      </section>
      <SignUpOverlay
        v-else
        :is-submitting="isSubmitting"
        :error-message="errorMessage"
        @submit="handleSubmit"
      />
    </div>
  </main>
</template>
