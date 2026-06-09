<script setup lang="ts">
import AppHeader from './layouts/AppHeader.vue';
import PageContainer from './layouts/PageContainer.vue';
import TokenShowcase from './components/TokenShowcase.vue';
import FloatingImageNetwork from './components/FloatingImageNetwork.vue';
import ColorPaletteSwatch from './components/ColorPaletteSwatch.vue';

const demoImages = [
  { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', alt: 'mountain' },
  { src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400', alt: 'forest' },
  { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', alt: 'portrait' },
  { src: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=400', alt: 'dog' },
  { src: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=400', alt: 'street' },
]

const demoColors = ['#F0EDE6', '#8A8880', '#3A3A42', '#17171D', '#060608']
</script>

<template>
  <AppHeader />
  <PageContainer>
    <div class="mb-8">
      <p class="text-caption font-mono text-text-secondary mb-4 uppercase tracking-widest">FloatingImageNetwork Preview</p>
      <FloatingImageNetwork :images="demoImages" />
    </div>
    <div class="mb-8 max-w-lg">
      <ColorPaletteSwatch :colors="demoColors" />
    </div>
    <TokenShowcase />
  </PageContainer>
</template>
