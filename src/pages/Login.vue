<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '@/layouts/AppHeader.vue';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import LoginOverlay from '@/components/overlay/LoginOverlay.vue';
import { useAuthStore } from '@/stores/auth.store';
import { getSafeRedirectPath } from '@/utils/redirect';
import { getErrorMessage } from '@/utils/api-error';
import type { LoginPayload } from '@/types/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isSubmitting = ref(false);
const errorMessage = ref('');

async function handleSubmit(payload: LoginPayload) {
  if (isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    await authStore.login(payload);
    router.push(getSafeRedirectPath(route.query.next, '/'));
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
          class-name="login-constellation"
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
          class-name="login-constellation"
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

    <AppHeader />

    <!-- 卡片 -->
    <div
      class="relative z-30 flex min-h-screen items-center justify-center px-4 pt-(--app-header-height)"
    >
      <LoginOverlay
        :is-submitting="isSubmitting"
        :error-message="errorMessage"
        @submit="handleSubmit"
      />
    </div>
  </main>
</template>

<style scoped>
:deep(.login-constellation) {
  animation: cs-fade-in 1500ms ease infinite alternate;
}

:deep(.login-constellation .constellation-background__canvas) {
  animation: cs-scale-in 620ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes cs-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes cs-scale-in {
  from {
    transform: scale(0.82);
  }
  to {
    transform: scale(1);
  }
}
</style>
