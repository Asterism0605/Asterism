<script setup lang="ts">
const year = new Date().getFullYear();
</script>

<template>
  <footer
    class="relative z-40 border-t border-white/10 bg-void/50 px-6 py-6 text-text-secondary backdrop-blur-sm"
  >
    <div
      class="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-caption sm:flex-row"
    >
      <p class="tracking-wide">© {{ year }} Asterism</p>
      <nav class="flex items-center gap-6">
        <RouterLink
          :to="{ name: 'privacy' }"
          class="transition-colors duration-200 hover:text-text-primary"
        >
          Privacy Policy
        </RouterLink>
        <RouterLink
          :to="{ name: 'terms' }"
          class="transition-colors duration-200 hover:text-text-primary"
        >
          Terms of Service
        </RouterLink>
      </nav>
    </div>
  </footer>
</template>
