<script setup lang="ts">
import { computed, ref } from 'vue';
import { Lock, Sparkles } from '@lucide/vue';
import Button from '@/components/ui/Button.vue';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import ModalOverlay from '@/components/overlay/ModalOverlay.vue';
import ColorPaletteSwatch from '@/components/ui/ColorPaletteSwatch.vue';
import ProfileCard from '@/components/ui/ProfileCard.vue';
import ThemeTag from '@/components/ui/ThemeTag.vue';
import AppHeader from '@/layouts/AppHeader.vue';
import PageContainer from '@/layouts/PageContainer.vue';

const isLimitModalOpen = ref(false);
const hoveredItemId = ref<number | null>(null);

const email = ref('');
const password = ref('');

const inspirationItems = [
  {
    id: 1,
    title: 'Chrome noir chair',
    category: 'Object',
    image: new URL('@/assets/hero.png', import.meta.url).href,
    position: 'lg:translate-y-8'
  },
  {
    id: 2,
    title: 'Shadow editorial',
    category: 'Style',
    image: new URL('@/assets/background.jpg', import.meta.url).href,
    position: 'lg:-translate-y-4'
  }
];

const themeTags = ['Editorial', 'Industrial', 'Chrome', 'Noir', 'Objects'];
const paletteColors = ['#060608', '#17171D', '#C45C3A', '#A8893A', '#F0EDE6'];

const activeItem = computed(
  () => inspirationItems.find((item) => item.id === hoveredItemId.value) ?? inspirationItems[0]
);

function openLimitModal() {
  isLimitModalOpen.value = true;
}
</script>

<template>
  <main
    class="playground-page min-h-screen overflow-hidden bg-void text-text-primary [--app-header-height:60px]"
  >
    <div class="pointer-events-none fixed inset-0 z-0 playground-page__wash" aria-hidden="true" />

    <AppHeader />

    <PageContainer>
      <section class="relative z-10 grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <div class="max-w-xl">
          <p class="text-mono uppercase tracking-[0.28em] text-gold-dim">Component Playground</p>
          <h1 class="mt-5 text-h1 font-normal leading-tight">
            Asterism overlay and constellation effects
          </h1>
          <p class="mt-5 max-w-lg text-sm leading-normal text-text-secondary sm:text-base">
            Hover the image tiles to reveal the constellation background, then open the modal to
            check the glass dialog layer in context.
          </p>

          <div class="mt-8 flex flex-wrap gap-3">
            <Button type="button" @click="openLimitModal">Open Limit Modal</Button>
            <Button type="button" variant="secondary" @click="openLimitModal">
              Preview Overlay
            </Button>
            <Button type="button" variant="ghost">Ghost Button</Button>
          </div>
        </div>

        <div class="grid min-h-[520px] grid-cols-1 gap-10 sm:grid-cols-2 sm:items-center">
          <article
            v-for="item in inspirationItems"
            :key="item.id"
            class="group relative min-h-80 overflow-visible"
            :class="item.position"
            @mouseenter="hoveredItemId = item.id"
            @mouseleave="hoveredItemId = null"
            @focusin="hoveredItemId = item.id"
            @focusout="hoveredItemId = null"
          >
            <ConstellationBackground
              class-name="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2"
              :active="hoveredItemId === item.id"
              :size="460"
              :line-length="250"
              :line-width="1.6"
              :line-opacity="0.82"
              :glow-opacity="0.16"
              :node-size="3.5"
              :spacing="50"
            />

            <button
              class="relative z-10 flex h-full min-h-80 w-full cursor-pointer flex-col justify-end overflow-hidden rounded-lg border border-white/10 bg-elevated text-left transition duration-300 hover:-translate-y-1 hover:border-gold-dim/50 hover:shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
              type="button"
              @click="openLimitModal"
            >
              <img
                class="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90"
                :src="item.image"
                :alt="item.title"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-void via-void/35 to-transparent" />
              <div class="relative z-10 p-5">
                <p class="text-mono uppercase tracking-[0.22em] text-gold-dim">
                  {{ item.category }}
                </p>
                <h2 class="mt-2 text-xl font-normal">{{ item.title }}</h2>
              </div>
            </button>
          </article>
        </div>
      </section>

      <section class="relative z-10 mt-10 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div class="flex flex-col gap-6 text-sm">
          <ProfileCard
            name="Zhenya Rukhlov"
            subtitle="Photographer / Object studies"
            :avatar-url="activeItem.image"
            show-follow
          />

          <ThemeTag :tags="themeTags" />
        </div>

        <div class="glass-panel grid gap-6 rounded-[32px] sm:grid-cols-[0.9fr_1.1fr] sm:p-6">
          <div class="overflow-hidden rounded-2xl border border-white/10 bg-elevated">
            <img
              class="aspect-[4/5] h-full w-full object-cover"
              :src="activeItem.image"
              :alt="activeItem.title"
            />
          </div>

          <div class="flex min-w-0 flex-col justify-between gap-8">
            <div>
              <div class="flex items-center gap-3 text-gold-dim">
                <Sparkles class="size-4" aria-hidden="true" />
                <p class="text-mono uppercase tracking-[0.24em]">Active selection</p>
              </div>
              <h2 class="mt-4 text-h2 font-normal">{{ activeItem.title }}</h2>
              <p class="mt-3 text-sm leading-normal text-text-secondary">
                The active card feeds the shared profile preview and keeps the palette and tag
                examples mounted with realistic neighboring content.
              </p>
            </div>

            <ColorPaletteSwatch :colors="paletteColors" />
          </div>
        </div>
      </section>
    </PageContainer>

    <ModalOverlay v-model="isLimitModalOpen" max-width="590px">
      <template #icon>
        <div
          class="flex size-14 items-center justify-center rounded-full bg-void/70 text-text-primary"
        >
          <Lock class="size-5" aria-hidden="true" />
        </div>
      </template>

      <template #title>Your daily inspiration limit has been reached.</template>

      <template #description>
        Create a free account to unlock endless scrolling, save your favorite pieces to boards, and
        define your aesthetic DNA.
      </template>

      <template #actions>
        <Button type="button" variant="primary">Create Free Account</Button>
        <Button type="button" variant="secondary">Log In</Button>
      </template>
    </ModalOverlay>
  </main>
</template>

<style scoped>
.playground-page__wash {
  background:
    radial-gradient(circle at 16% 18%, rgb(196 92 58 / 0.12), transparent 26%),
    radial-gradient(circle at 82% 28%, rgb(168 137 58 / 0.16), transparent 24%),
    linear-gradient(180deg, var(--color-void) 0%, var(--color-deep) 48%, var(--color-void) 100%);
}

.playground-page__wash::after {
  position: absolute;
  inset: 0;
  content: '';
  opacity: 0.14;
  background-image:
    linear-gradient(rgb(240 237 230 / 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgb(240 237 230 / 0.05) 1px, transparent 1px);
  background-size: 112px 112px;
  mask-image: linear-gradient(180deg, black, transparent 84%);
}
</style>
