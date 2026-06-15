<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from './layouts/AppHeader.vue';

const route = useRoute();
const headerlessRouteNames = new Set(['discover-dna']);
const showHeader = computed(() => !headerlessRouteNames.has(String(route.name)));
</script>
<template>
  <AppHeader v-if="showHeader" />
  <RouterView />
</template>
