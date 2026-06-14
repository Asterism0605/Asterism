<script setup lang="ts">
import AppHeader from '@/layouts/AppHeader.vue';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import SignUpOverlay from '@/components/overlay/SignUpOverlay.vue';

interface SignUpPayload {
  email: string;
  password: string;
}

function handleSubmit(_payload: SignUpPayload) {
  // auth logic TBD
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
          class-name="signup-constellation"
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
          class-name="signup-constellation"
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

    <SignUpOverlay @submit="handleSubmit" />
  </main>
</template>

<style scoped>
:deep(.signup-constellation) {
  animation: cs-fade-in 1500ms ease infinite alternate;
}

:deep(.signup-constellation .constellation-background__canvas) {
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
