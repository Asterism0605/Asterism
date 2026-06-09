<script setup lang="ts">
import AppHeader from './layouts/AppHeader.vue';
import PageContainer from './layouts/PageContainer.vue';
import TokenShowcase from './components/TokenShowcase.vue';
import FloatingImageNetwork from './components/FloatingImageNetwork.vue';
import ColorPaletteSwatch from './components/ColorPaletteSwatch.vue';
import Playground from './pages/Playground.vue';

const demoImages = [
  { src: '/images/image2.png', alt: 'group 1' },
  { src: '/images/image1.png', alt: 'group 2' },
  { src: '/images/image3.png', alt: 'chair' },
  { src: '/images/image4.png', alt: 'group 3' },
  { src: '/images/image5.png', alt: 'art' },
]

const demoColors = ['#F0EDE6', '#8A8880', '#3A3A42', '#17171D', '#060608']
</script>

<template>
  <AppHeader />
  <Playground />
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
