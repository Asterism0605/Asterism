<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppToast from './components/ui/AppToast.vue';
import AppHeader from './layouts/AppHeader.vue';
import AppFooter from './layouts/AppFooter.vue';
import UserTourPauseModal from '@/components/feature/guide/UserTourPauseModal.vue';

const route = useRoute();
const headerlessRouteNames = new Set(['auth-callback']);
// 沉浸式 / 全畫布頁面不放流式 footer，避免破壞固定版面
const footerlessRouteNames = new Set([
  'home',
  'discover-dna',
  'moodboard',
  'image-spread',
  'image-search',
  'picture-detail',
  'style-dna',
  'style-dna-result',
  'account-consultations',
  'auth-callback'
]);
const showHeader = computed(() => !headerlessRouteNames.has(String(route.name)));
const showFooter = computed(() => !footerlessRouteNames.has(String(route.name)));
const routeTransitionName = computed(() =>
  route.name === 'home' && route.query.source === 'style-dna' ? 'style-dna-home' : undefined
);
</script>
<template>
  <AppHeader v-if="showHeader" />
  <RouterView v-slot="{ Component, route: viewRoute }">
    <Transition :name="routeTransitionName">
      <component :is="Component" :key="viewRoute.fullPath" />
    </Transition>
  </RouterView>
  <AppFooter v-if="showFooter" />
  <AppToast />
  <UserTourPauseModal />
</template>

<style>
.style-dna-home-leave-active {
  position: fixed;
  inset: 0;
  z-index: 40;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--color-void);
  transition: opacity 260ms ease;
}

.style-dna-home-leave-active
  > section
  > div
  > :not(.result-personalized-message-layer) {
  opacity: 0 !important;
}

.style-dna-home-enter-active {
  transition: opacity 360ms ease 80ms;
}

.style-dna-home-leave-to {
  opacity: 0;
}

.style-dna-home-enter-from {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .style-dna-home-leave-active,
  .style-dna-home-enter-active {
    transition-duration: 1ms;
  }
}
</style>
