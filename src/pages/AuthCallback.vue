<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { getSafeRedirectPath } from '@/utils/redirect';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const failed = ref(false);

function hasOAuthError(): boolean {
  if (route.query.error) return true;
  return typeof window !== 'undefined' && window.location.hash.includes('error');
}

onMounted(async () => {
  if (!hasOAuthError()) {
    try {
      await authStore.hydrate();
    } catch {
      // 下面以 isAuthenticated 判斷
    }
    if (authStore.isAuthenticated) {
      void router.replace(getSafeRedirectPath(route.query.next, '/'));
      return;
    }
  }
  failed.value = true;
});
</script>

<template>
  <main
    class="relative flex min-h-screen flex-col items-center justify-center gap-4 bg-void px-6 text-center text-text-primary"
  >
    <template v-if="!failed">
      <p class="text-sm text-text-secondary">Signing you in…</p>
    </template>
    <template v-else>
      <h1 class="text-h2">Sign-in failed</h1>
      <p class="text-body max-w-md text-text-secondary">
        We couldn't complete your sign-in. Please try again.
      </p>
      <RouterLink
        :to="{ name: 'login' }"
        class="text-caption text-gold-dim underline transition hover:text-text-primary"
      >
        Back to login
      </RouterLink>
    </template>
  </main>
</template>
