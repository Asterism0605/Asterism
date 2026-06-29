<script setup lang="ts">
import GoogleSignInButton from '@/components/auth/GoogleSignInButton.vue';
</script>

<template>
  <div class="oauth-divider"><span>or</span></div>
  <GoogleSignInButton />
</template>

<style scoped>
.oauth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0 16px;
  color: var(--color-text-secondary);
  font-size: var(--text-mono);
  letter-spacing: 0.1em;
}

.oauth-divider::before,
.oauth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgb(255 255 255 / 0.12);
}
</style>
