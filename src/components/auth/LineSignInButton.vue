<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { getSafeRedirectPath } from '@/utils/redirect';

const route = useRoute();
const error = ref(false);

// LINE 設定全在 Edge Function；前端只把瀏覽器整頁導去 start endpoint（無 code → function 302 到 LINE 授權頁）。
// 唯一導向前的失敗：VITE_SUPABASE_URL 沒設，無法組出 endpoint。
function signIn() {
  error.value = false;
  const base = import.meta.env.VITE_SUPABASE_URL;
  if (!base) {
    error.value = true;
    return;
  }
  const next = getSafeRedirectPath(route.query.next, '/');
  const start = new URL(`${base}/functions/v1/line-callback`);
  // origin 讓 Edge 知道要 302 回哪個前端（prod / 本地 dev），Edge 端有白名單把關。
  start.searchParams.set('origin', window.location.origin);
  if (next !== '/') start.searchParams.set('next', next);
  window.location.href = start.toString();
}
</script>

<template>
  <button
    type="button"
    data-testid="line-signin"
    aria-label="Continue with LINE"
    class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
    @click="signIn"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#06C755"
        d="M24 10.3C24 4.6 18.3 0 12 0S0 4.6 0 10.3c0 5.1 4.5 9.4 10.6 10.2.4.1 1 .3 1.1.6.1.3.1.7 0 1l-.2 1.1c-.1.3-.3 1.3 1.1.7s7.5-4.4 10.2-7.6c1.9-2 2.8-4.1 2.8-6"
      />
      <path
        fill="#fff"
        d="M19.4 13.6h-3.4a.23.23 0 0 1-.23-.23V8.1a.23.23 0 0 1 .23-.23h.85a.23.23 0 0 1 .23.23v4.05h2.09a.23.23 0 0 1 .23.23v.85a.23.23 0 0 1-.23.23m-9.3 0H9.25a.23.23 0 0 1-.23-.23V8.1a.23.23 0 0 1 .23-.23h.85a.23.23 0 0 1 .23.23v5.27a.23.23 0 0 1-.23.23m-1.94 0H4.77a.23.23 0 0 1-.23-.23V8.1a.23.23 0 0 1 .23-.23h.85a.23.23 0 0 1 .23.23v4.05h2.04a.23.23 0 0 1 .23.23v.85a.23.23 0 0 1-.23.23m6.55-5.5v.85a.23.23 0 0 1-.23.23h-2.08v.8h2.08a.23.23 0 0 1 .23.23v.85a.23.23 0 0 1-.23.23h-2.08v.8h2.08a.23.23 0 0 1 .23.23v.85a.23.23 0 0 1-.23.23h-3.16a.23.23 0 0 1-.23-.23V8.1a.23.23 0 0 1 .23-.23h3.16a.23.23 0 0 1 .23.23"
      />
    </svg>
    LINE
  </button>
  <p v-if="error" class="mt-2 text-center font-mono text-xs text-red-400" role="alert">
    LINE sign-in failed. Please try again.
  </p>
</template>
