<script setup lang="ts">
import type { EmailOtpType } from '@supabase/supabase-js';
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
    const tokenHash = route.query.token_hash;
    // LINE 登入 / 信箱驗證 / 密碼重設：type 預設 magiclink。
    const type = typeof route.query.type === 'string' ? route.query.type : 'magiclink';
    try {
      if (typeof tokenHash === 'string') {
        // 網址帶一次性 token_hash → verifyOtp 換 session。
        await authStore.verifyOtp(tokenHash, type as EmailOtpType);
      } else {
        // Google：detectSessionInUrl 已自動完成 PKCE，hydrate 讀回現存 session。
        await authStore.hydrate();
      }
    } catch {
      // 下面以 isAuthenticated 判斷
    }
    if (authStore.isAuthenticated) {
      // 密碼重設：只有 token_hash+recovery 驗證成功（isPasswordRecovery）才導去設定新密碼頁，
      // 光靠 query type=recovery（例如沒帶 token_hash）不算，避免任何登入者被導進 reset 表單。
      if (authStore.isPasswordRecovery) {
        void router.replace({ name: 'reset-password' });
        return;
      }
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
      <p class="text-sm text-text-secondary">{{ $t('auth.signingIn') }}</p>
    </template>
    <template v-else>
      <h1 class="text-h2">{{ $t('auth.signInFailed') }}</h1>
      <p class="text-body max-w-md text-text-secondary">
        {{ $t('auth.signInFailedDesc') }}
      </p>
      <RouterLink
        :to="{ name: 'login' }"
        class="text-caption text-gold-dim underline transition hover:text-text-primary"
      >
        {{ $t('auth.backToLogin') }}
      </RouterLink>
    </template>
  </main>
</template>
