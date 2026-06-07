<script setup lang="ts">
import AppButton from '@/components/Button.vue'
</script>

<template>
  <header
    class="fixed w-full top-0 z-50 flex items-center justify-between px-8 py-4 border-b border-white/5 bg-deep/80 backdrop-blur-xl"
  >
    <div class="flex items-center gap-2">
      <img class="w-8 h-8" src="/sitelogo.png" alt="Asterism" />
      <span class="text-sm font-semibold text-text-primary tracking-wide">Asterism</span>
    </div>

    <div class="flex items-center gap-3">
      <AppButton variant="ghost">Log in</AppButton>
      <AppButton variant="primary">Sign Up</AppButton>
    </div>
  </header>
</template>
