<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import SignUpOverlay from '@/components/overlay/SignUpOverlay.vue';
import { useAuthStore } from '@/stores/auth.store';
import { getSafeRedirectPath } from '@/utils/redirect';
import { getErrorMessage } from '@/utils/api-error';
import type { RegisterPayload } from '@/types/auth';
import { useStyleDnaStore } from '@/stores/style-dna.store';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const styleDnaStore = useStyleDnaStore();
const { t } = useI18n();

const isSubmitting = ref(false);
const errorMessage = ref('');

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
    errorMessage.value = getErrorMessage(error, t('auth.genericError'));
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
      <SignUpOverlay
        :is-submitting="isSubmitting"
        :error-message="errorMessage"
        @submit="handleSubmit"
        @login="handleLoginClick"
      />
    </div>
  </main>
</template>
