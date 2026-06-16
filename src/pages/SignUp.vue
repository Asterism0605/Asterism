<script setup lang="ts">
import { ref } from 'vue';
import AppHeader from '@/layouts/AppHeader.vue';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import FormInput from '@/components/ui/FormInput.vue';
import Button from '@/components/ui/Button.vue';

const email = ref('');
const password = ref('');

function handleSubmit() {
  // auth logic TBD
}
</script>

<template>
  <main
    class="relative min-h-screen overflow-hidden bg-void text-text-primary [--app-header-height:60px]"
  >
    <!-- 背景遮罩 -->
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

    <!-- 星座 -->
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

    <AppHeader />

    <!-- 卡片 -->
    <div
      class="relative z-30 flex min-h-screen items-center justify-center px-4 pt-(--app-header-height)"
    >
      <section
        class="overlay-panel overlay-form glass-panel"
        style="max-width: 640px; padding: 72px 64px 68px"
        role="main"
        aria-label="Sign up"
      >
        <h2 class="overlay-title">Sign up</h2>

        <div class="overlay-fields">
          <FormInput v-model="email" type="email" placeholder="EMAIL" autocomplete="email" />
          <FormInput
            v-model="password"
            type="password"
            placeholder="PASSWORD"
            autocomplete="new-password"
          />
        </div>

        <div class="overlay-actions">
          <span class="overlay-submit">
            <Button variant="secondary" type="button" @click="handleSubmit">SEND</Button>
          </span>
        </div>
      </section>
    </div>
  </main>
</template>
