<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import Button from '@/components/ui/Button.vue';
import UserMenu from '@/layouts/UserMenu.vue';
import { getImageById } from '@/services/image.service';

const siteLogoSrc = '/sitelogo.png';
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isPictureDetail = computed(
  () => route.name === 'picture-detail' && !!getImageById(route.params.imageId as string)
);

const initials = computed(() =>
  (authStore.user?.displayName ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
);

function goToMoodboard() {
  router.push({ name: 'moodboard' });
}

function handleLogout() {
  authStore.logout();
}
</script>

<template>
  <header
    :class="[
      'fixed top-0 z-60 flex items-center justify-between px-8 py-4 border-b border-white/5 bg-deep/80 backdrop-blur-xl',
      isPictureDetail ? 'max-md:hidden md:w-3/5' : 'w-full'
    ]"
  >
    <button
      type="button"
      class="flex items-center gap-2 cursor-pointer transition-opacity duration-200 hover:opacity-75"
      @click="router.push({ name: 'home' })"
    >
      <img class="w-8 h-8" :src="siteLogoSrc" alt="Asterism" />
    </button>

    <div class="flex items-center gap-3">
      <template v-if="!authStore.isAuthenticated">
        <Button variant="ghost" @click="router.push({ name: 'login' })">Log in</Button>
        <Button variant="primary" @click="router.push({ name: 'sign-up' })">Sign Up</Button>
      </template>

      <UserMenu
        v-else
        :display-name="authStore.user?.displayName ?? ''"
        :initials="initials"
        @moodboard="goToMoodboard"
        @logout="handleLogout"
      />
    </div>
  </header>
</template>
