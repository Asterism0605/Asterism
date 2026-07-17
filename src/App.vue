<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppToast from './components/ui/AppToast.vue';
import AppHeader from './layouts/AppHeader.vue';
import AppFooter from './layouts/AppFooter.vue';
import UserTourPauseModal from './components/feature/guide/components/UserTourPauseModal.vue';

const route = useRoute();
const headerlessRouteNames = new Set(['auth-callback']);
// 沉浸式 / 全畫布頁面不放流式 footer，避免破壞固定版面
const footerlessRouteNames = new Set([
  'home',
  'discover-dna',
  'moodboard',
  'image-spread',
  'picture-detail',
  'style-dna',
  'style-dna-result',
  'account-consultations',
  'auth-callback'
]);
const showHeader = computed(() => !headerlessRouteNames.has(String(route.name)));
const showFooter = computed(() => !footerlessRouteNames.has(String(route.name)));
</script>
<template>
  <AppHeader v-if="showHeader" />
  <RouterView />
  <AppFooter v-if="showFooter" />
  <AppToast />
  <UserTourPauseModal />
</template>
