<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Lock } from '@lucide/vue';
import Button from '@/components/ui/Button.vue';
import ModalOverlay from '@/components/overlay/ModalOverlay.vue';
import FloatingImageNetwork from '@/components/sections/FloatingImageNetwork';
import AppHeader from '@/layouts/AppHeader.vue';

const scrollLimitVh = 150;
const isLimitModalOpen = ref(false);
const hasTriggeredLimit = ref(false);

const inspirationImages = [
  { src: '/images/image3.png', alt: 'Chrome chair inspiration' },
  { src: '/images/image2.png', alt: 'Editorial style group' },
  { src: '/images/image1.png', alt: 'Layered fashion portrait' },
  { src: '/images/image4.png', alt: 'Outdoor fashion moment' },
  { src: '/images/image5.png', alt: 'Monochrome object study' }
];

function openLimitModal() {
  if (hasTriggeredLimit.value) {
    return;
  }

  hasTriggeredLimit.value = true;
  isLimitModalOpen.value = true;
}

function handleScrollLimit() {
  if (typeof window === 'undefined') {
    return;
  }

  const limit = window.innerHeight * (scrollLimitVh / 100);
  const viewportBottom = window.scrollY + window.innerHeight;

  if (viewportBottom >= limit) {
    openLimitModal();
  }
}

onMounted(() => {
  handleScrollLimit();
  window.addEventListener('scroll', handleScrollLimit, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScrollLimit);
});
</script>

<template>
  <main class="home-page relative min-h-[160vh] overflow-hidden bg-void text-text-primary">
    <div class="pointer-events-none absolute inset-0 z-0 home-page__wash" aria-hidden="true" />

    <AppHeader />

    <section class="relative z-10 min-h-[150vh] pt-28">
      <div class="absolute inset-x-0 top-0 z-10 h-[112vh]">
        <FloatingImageNetwork
          :images="inspirationImages"
          height="200vh"
          layout="home"
          show-constellations
        />
      </div>

      <div class="pointer-events-none relative z-20 pt-[20vh] sm:pl-20 sm:pt-[40vh]">
        <h1
          class="text-display max-w-[9ch] font-normal tracking-normal text-text-primary [text-shadow:0_4px_24px_rgba(255,255,255,0.18)]"
        >
          Asterism
        </h1>

        <div class="meteor-arrows mt-4 flex translate-x-[10vw] gap-5 sm:gap-2" aria-hidden="true">
          <svg class="meteor-arrow" viewBox="0 0 90 90" focusable="false">
            <path d="M78 10L18 70M18 70H42M18 70V46" />
          </svg>
          <svg class="meteor-arrow meteor-arrow--delay-1" viewBox="0 0 90 90" focusable="false">
            <path d="M78 10L18 70M18 70H42M18 70V46" />
          </svg>
          <svg class="meteor-arrow meteor-arrow--delay-2" viewBox="0 0 90 90" focusable="false">
            <path d="M78 10L18 70M18 70H42M18 70V46" />
          </svg>
        </div>
      </div>
    </section>
    <ModalOverlay v-model="isLimitModalOpen" max-width="590px" :close-on-backdrop="true">
      <template #icon>
        <div
          class="flex size-14 items-center justify-center rounded-full bg-void/70 text-text-primary"
        >
          <Lock
            class="size-5"
            aria-hidden="true"
          />
        </div>
      </template>

      <template #title>Your daily inspiration limit has been reached.</template>

      <template #description>
        Create a free account to unlock endless scrolling, save your favorite pieces to boards, and
        define your aesthetic DNA.
      </template>

      <template #actions>
        <Button variant="primary">Create Free Account</Button>
        <Button variant="secondary">Log In</Button>
      </template>
    </ModalOverlay>
  </main>
</template>

<style scoped>
.home-page__wash {
  background:
    radial-gradient(circle at 26% 32%, rgb(240 237 230 / 0.05), transparent 28%),
    radial-gradient(circle at 78% 24%, rgb(168 137 58 / 0.08), transparent 24%),
    linear-gradient(180deg, var(--color-void) 0%, var(--color-deep) 56%, var(--color-void) 100%);
}

.home-page__wash::after {
  position: absolute;
  inset: 0;
  content: '';
  opacity: 0.16;
  background-image:
    linear-gradient(rgb(240 237 230 / 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgb(240 237 230 / 0.05) 1px, transparent 1px);
  background-size: 118px 118px;
  mask-image: linear-gradient(180deg, transparent, black 12%, black 78%, transparent);
}

.meteor-arrow {
  display: block;
  width: 90px;
  height: 90px;
  overflow: visible;
  fill: none;
  stroke: rgb(240 237 230 / 0.42);
  stroke-linecap: square;
  stroke-linejoin: miter;
  stroke-width: 1;
  animation: meteorArrow 2.4s ease-in-out infinite;
}

.meteor-arrow--delay-1 {
  animation-delay: 0.24s;
}

.meteor-arrow--delay-2 {
  animation-delay: 0.48s;
}

@keyframes meteorArrow {
  0% {
    opacity: 0;
    translate: 22px -22px;
  }

  34% {
    opacity: 0.72;
  }

  100% {
    opacity: 0;
    translate: -14px 14px;
  }
}

@media (max-width: 768px) {
  .meteor-arrows {
    transform: translateX(12vw) scale(0.72);
    transform-origin: left center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .meteor-arrow {
    animation-duration: 1ms;
  }
}
</style>
