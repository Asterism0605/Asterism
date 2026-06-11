<script setup lang="ts">
import { ref } from 'vue';
import AppHeader from './layouts/AppHeader.vue';
import PageContainer from './layouts/PageContainer.vue';
import TokenShowcase from './components/sections/TokenShowcase.vue';
import FloatingImageNetwork from './components/sections/FloatingImageNetwork.vue';
import ColorPaletteSwatch from './components/ui/ColorPaletteSwatch.vue';
import Playground from './pages/Playground.vue';
import SignUpOverlay from './components/overlay/SignUpOverlay.vue';
import LoginOverlay from './components/overlay/LoginOverlay.vue';
import MoodboardOrbit from './pages/MoodboardOrbit.vue';
import ThemeTag from './components/ui/ThemeTag.vue';
import ProfileCard from './components/ui/ProfileCard.vue';

const showSignUp = ref(true);
const showLogin = ref(false);

// 切換有/無資料夾狀態
const orbitHasFolders = ref(true);

const demoImages = [
  { src: '/images/image2.png', alt: 'group 1' },
  { src: '/images/image1.png', alt: 'group 2' },
  { src: '/images/image3.png', alt: 'chair' },
  { src: '/images/image4.png', alt: 'group 3' },
  { src: '/images/image5.png', alt: 'art' },
  { src: '/images/image3.png', alt: 'chair 2' },
  { src: '/images/image1.png', alt: 'group 4' },
  { src: '/images/image4.png', alt: 'group 5' },
  { src: '/images/image2.png', alt: 'group 6' }
];

// 每個 folder 補足 9 張，讓 Fibonacci 球面更飽滿
const demoFolders = [
  {
    id: 'editorial',
    name: 'Editorial',
    images: [
      { src: '/images/image1.png' },
      { src: '/images/image2.png' },
      { src: '/images/image3.png' },
      { src: '/images/image4.png' },
      { src: '/images/image5.png' },
      { src: '/images/image2.png' },
      { src: '/images/image4.png' },
      { src: '/images/image1.png' },
      { src: '/images/image3.png' }
    ]
  },
  {
    id: 'portrait',
    name: 'Portrait',
    images: [
      { src: '/images/image3.png' },
      { src: '/images/image5.png' },
      { src: '/images/image1.png' },
      { src: '/images/image2.png' },
      { src: '/images/image4.png' },
      { src: '/images/image3.png' },
      { src: '/images/image5.png' },
      { src: '/images/image1.png' },
      { src: '/images/image2.png' }
    ]
  },
  {
    id: 'abstract',
    name: 'Abstract',
    images: [
      { src: '/images/image2.png' },
      { src: '/images/image4.png' },
      { src: '/images/image5.png' },
      { src: '/images/image1.png' },
      { src: '/images/image3.png' },
      { src: '/images/image4.png' },
      { src: '/images/image2.png' },
      { src: '/images/image5.png' },
      { src: '/images/image1.png' }
    ]
  }
];

const demoColors = ['#F0EDE6', '#8A8880', '#3A3A42', '#17171D', '#060608'];
const demoThemeTags = ['Label', 'Editorial', 'Monochrome', 'Avant-garde', 'Industrial'];
</script>

<template>
  <AppHeader />
  <Playground />
  <PageContainer>
    <div class="mb-14 flex flex-col gap-14">
      <ThemeTag :tags="demoThemeTags" />
      <section class="flex flex-col gap-5">
        <div class="flex items-baseline gap-3">
          <h2 class="text-h2 font-bold tracking-tight">Profile</h2>
        </div>
        <div class="max-w-3xl">
          <ProfileCard name="Zhenya Rukhlov" subtitle="Photographer / Image detail" show-follow />
        </div>
      </section>
    </div>
    <div class="mb-8">
      <p class="text-caption font-mono text-text-secondary mb-4 uppercase tracking-widest">
        FloatingImageNetwork Preview
      </p>
      <FloatingImageNetwork :images="demoImages" :line-width="1.55" :line-opacity="0.78" />
    </div>
    <div class="mb-8 max-w-lg">
      <ColorPaletteSwatch :colors="demoColors" />
    </div>
    <TokenShowcase />
  </PageContainer>

  <!-- MoodboardOrbit: full-width, outside PageContainer constraint -->
  <div class="mb-8">
    <MoodboardOrbit
      :folders="orbitHasFolders ? demoFolders : []"
      :images="orbitHasFolders ? [] : demoImages"
      height="720px"
    />
  </div>
  <SignUpOverlay v-if="showSignUp" v-model="showSignUp" />
  <LoginOverlay v-if="showLogin" v-model="showLogin" />
</template>
