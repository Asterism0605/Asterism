<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Button from '@/components/ui/Button.vue';
import { getImageById } from '@/services/image.service';

const siteLogoSrc = '/sitelogo.png';
const route = useRoute();

const isPictureDetail = ref(false);
watch(
  () => [route.name, route.params.imageId] as const,
  async ([name, imageId]) => {
    isPictureDetail.value =
      name === 'picture-detail' && !!(await getImageById(imageId as string));
  },
  { immediate: true }
);
</script>

<template>
  <header
    :class="[
      'fixed top-0 z-60 flex items-center justify-between px-8 py-4 border-b border-white/5 bg-deep/80 backdrop-blur-xl',
      isPictureDetail ? 'max-md:hidden md:w-3/5' : 'w-full'
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
