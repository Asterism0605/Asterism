<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from '@/components/ui/Button.vue';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';

const route = useRoute();
const router = useRouter();

const errorType = computed(() => {
  return (route.meta.errorType as string) || '404';
});

const content = computed(() => {
  if (errorType.value === 'coming-soon') {
    return {
      code: 'COMING SOON',
      title: 'Inspiration Detail is under construction.',
      desc: '我們正在精心雕琢此靈感詳情頁面，它即將隨著星圖更新一同解鎖。',
      actionText: 'Back'
    };
  }
  return {
    code: '404',
    title: 'This constellation does not exist.',
    desc: '您所造訪的座標不在目前的星圖範圍內，請重新調整您的探索路徑。',
    actionText: 'Back'
  };
});

function handleAction() {
  if (errorType.value === 'coming-soon') {
    router.back();
  } else {
    router.push('/');
  }
}
</script>

<template>
  <main class="error-page relative min-h-screen overflow-hidden bg-void text-text-primary">
    <!-- 延續首頁與展開頁的星空發光背景 -->
    <div class="pointer-events-none absolute inset-0 z-0 error-page__wash" aria-hidden="true" />

    <!-- 居中星座背景效果 -->
    <div
      class="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 opacity-60"
      aria-hidden="true"
    >
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

    <div
      class="relative z-20 flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      <div class="max-w-xl">
        <span class="text-caption font-mono uppercase tracking-[0.24em] text-gold-dim">
          {{ content.code }}
        </span>

        <h1 class="text-h1 mt-3 font-bold tracking-normal sm:text-5xl">
          {{ content.title }}
        </h1>

        <p class="text-body mt-6 leading-7 text-text-secondary">
          {{ content.desc }}
        </p>

        <div class="mt-10 flex justify-center gap-4">
          <Button data-testid="error-action" type="button" variant="primary" @click="handleAction">
            {{ content.actionText }}
          </Button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.error-page__wash {
  background:
    radial-gradient(circle at 50% 50%, rgb(168 137 58 / 0.12), transparent 35%),
    linear-gradient(180deg, var(--color-void) 0%, var(--color-deep) 60%, var(--color-void) 100%);
}
</style>
