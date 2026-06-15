<script setup lang="ts">
import { useRoute } from 'vue-router';
import Button from '@/components/ui/Button.vue';

const siteLogoSrc = '/sitelogo.png';
const route = useRoute();
</script>

<template>
  <header
    :class="[
      'fixed w-full top-0 z-60 flex items-center justify-between px-8 py-4 border-b border-white/5 bg-deep/80 backdrop-blur-xl',
      route.name === 'picture-detail' ? 'max-md:hidden md:w-1/2' : 'w-full'
    ]"
  >
    <div class="flex items-center gap-2">
      <img class="w-8 h-8" :src="siteLogoSrc" alt="Asterism" />
    </div>

    <div class="flex items-center gap-3">
      <Button variant="ghost">Log in</Button>
      <Button variant="primary">Sign Up</Button>
    </div>
  </header>
</template>
