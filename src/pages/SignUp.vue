<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import SignUpOverlay from '@/components/overlay/SignUpOverlay.vue';
import VerificationSentOverlay from '@/components/overlay/VerificationSentOverlay.vue';
import { useCountdown } from '@/composables/useCountdown';
import { useAuthStore } from '@/stores/auth.store';
import { getSafeRedirectPath } from '@/utils/redirect';
import { getErrorCode, getErrorMessage } from '@/utils/api-error';
import type { RegisterPayload } from '@/types/auth';
import { useStyleDnaStore } from '@/stores/style-dna.store';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const styleDnaStore = useStyleDnaStore();

const isSubmitting = ref(false);
const errorMessage = ref('');
// 開啟 Confirm email 時，註冊不回 session 而是寄驗證信；存收件信箱以顯示「驗證信已寄出」引導畫面。
const sentToEmail = ref('');

// 重寄驗證信：cooldown 對齊 Supabase SMTP 的 Minimum interval（60s），避免狂點吃 rate-limit。
const resendMessage = ref('');
const { countdown: resendCountdown, start: startCooldown } = useCountdown(60);

async function handleResend() {
  resendMessage.value = '';
  try {
    await authStore.resendSignup(sentToEmail.value);
    resendMessage.value = 'Verification email resent.';
    startCooldown();
  } catch (error) {
    resendMessage.value = getErrorMessage(error, "Couldn't resend right now. Please try again.");
  }
}

async function handleSubmit(payload: RegisterPayload) {
  if (isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    const session = await authStore.register(payload);
    try {
      await styleDnaStore.reconcileWithServer(session.user.id);
    } catch (error) {
      console.warn('[style-dna] sync after registration failed:', error);
    }
    router.push(getSafeRedirectPath(route.query.next, '/discover-dna'));
  } catch (error) {
    // 已開信箱驗證：非錯誤，轉成正向「請至信箱收信」引導畫面。
    if (getErrorCode(error) === 'EMAIL_CONFIRMATION_REQUIRED') {
      sentToEmail.value = payload.email;
      // 註冊已寄出第一封信＝已佔用 60s rate-limit 窗，先起跑 cooldown，
      // 否則使用者馬上按重寄會直接撞 Supabase 限流報錯。
      startCooldown();
    } else {
      errorMessage.value = getErrorMessage(error, 'Something went wrong. Please try again.');
    }
  } finally {
    isSubmitting.value = false;
  }
}

function handleLoginClick() {
  const nextPath = getSafeRedirectPath(route.query.next, '');
  router.push({
    name: 'login',
    query: nextPath ? { next: nextPath } : undefined
  });
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
      <VerificationSentOverlay
        v-if="sentToEmail"
        :email="sentToEmail"
        :resend-message="resendMessage"
        :countdown="resendCountdown"
        @resend="handleResend"
      />
      <SignUpOverlay
        v-else
        :is-submitting="isSubmitting"
        :error-message="errorMessage"
        @submit="handleSubmit"
        @login="handleLoginClick"
      />
    </div>
  </main>
</template>
