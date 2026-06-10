<script setup lang="ts">
import Button from '@/components/ui/Button.vue';

const siteLogoSrc = '/sitelogo.png';
</script>

<template>
  <header
    class="fixed top-0 z-50 flex h-15 w-full items-center justify-between border-b border-white/5 bg-deep/80 px-8 py-4 backdrop-blur-xl"
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
