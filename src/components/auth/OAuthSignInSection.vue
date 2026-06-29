<script setup lang="ts">
import GoogleSignInButton from '@/components/auth/GoogleSignInButton.vue';
import LineSignInButton from '@/components/auth/LineSignInButton.vue';
</script>

<template>
  <div class="oauth-divider"><span>or</span></div>
  <div class="oauth-buttons">
    <div><GoogleSignInButton /></div>
    <div><LineSignInButton /></div>
  </div>
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

.oauth-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: start;
}

/* iPhone SE 等 ≤380px 窄機兩欄會擠/不對稱，改單欄堆疊 */
@media (max-width: 380px) {
  .oauth-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
