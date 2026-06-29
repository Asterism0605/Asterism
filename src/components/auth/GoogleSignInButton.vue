<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { getSafeRedirectPath } from '@/utils/redirect';

const route = useRoute();
const authStore = useAuthStore();
const error = ref(false);
const loading = ref(false);

// 成功時瀏覽器會整頁導去 Google；只有「導向前就失敗」（provider 沒開、redirectTo 不在白名單）才會 reject。
async function signIn() {
  if (loading.value) return;
  error.value = false;
  loading.value = true;
  const next = getSafeRedirectPath(route.query.next, '/');
  try {
    await authStore.signInWithGoogle(next);
  } catch {
    error.value = true;
    loading.value = false;
  }
}
</script>

<template>
  <button
    type="button"
    data-testid="google-signin"
    aria-label="Continue with Google"
    :disabled="loading"
    class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
    @click="signIn"
  >
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.63Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
    Google
  </button>
  <p v-if="error" class="mt-2 text-center font-mono text-xs text-red-400" role="alert">
    Google sign-in failed. Please try again.
  </p>
</template>
