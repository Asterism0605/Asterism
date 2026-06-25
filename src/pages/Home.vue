<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Lock, MoveDownLeft } from '@lucide/vue';
import { useRouter } from 'vue-router';
import Button from '@/components/ui/Button.vue';
import ModalOverlay from '@/components/overlay/ModalOverlay.vue';
import FloatingImageNetwork from '@/components/sections/FloatingImageNetwork';
import { getHomeInspirationImages } from '@/services/image.service';
import { useAuthStore } from '@/stores/auth.store';
import { useStyleDnaStore } from '@/stores/style-dna.store';
import type { HomeInspirationImage } from '@/types/image';

const scrollLimitVh = 150;
const router = useRouter();
const authStore = useAuthStore();
const styleDnaStore = useStyleDnaStore();
const isLimitModalOpen = ref(false);
const hasTriggeredLimit = ref(false);
const inspirationImages = ref<HomeInspirationImage[]>([]);

const HOME_DENSITY_PER_100VH = 5;
const homePreferredStyles = computed(() =>
  styleDnaStore.hasCompletedQuiz ? styleDnaStore.preferredStyles : []
);
const containerHeight = computed(
  () => `${(inspirationImages.value.length / HOME_DENSITY_PER_100VH) * 100}vh`
);

function getGuestScrollLimitTop(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  const limitHeight = window.innerHeight * (scrollLimitVh / 100);
  return Math.max(0, limitHeight - window.innerHeight);
}

function clampGuestScrollPosition(): void {
  if (typeof window === 'undefined' || authStore.isAuthenticated) {
    return;
  }

  const limitTop = getGuestScrollLimitTop();

  if (window.scrollY <= limitTop) {
    return;
  }

  window.scrollTo({
    top: limitTop,
    behavior: 'auto'
  });
}

function openLimitModal() {
  if (hasTriggeredLimit.value) {
    return;
  }

  hasTriggeredLimit.value = true;
  isLimitModalOpen.value = true;
}

function handleLimitModalClose() {
  clampGuestScrollPosition();
}

function handleScrollLimit() {
  if (typeof window === 'undefined' || authStore.isAuthenticated) {
    return;
  }

  const limit = getGuestScrollLimitTop() + window.innerHeight;
  const viewportBottom = window.scrollY + window.innerHeight;

  if (viewportBottom >= limit) {
    openLimitModal();
  }

  if (hasTriggeredLimit.value && !isLimitModalOpen.value) {
    clampGuestScrollPosition();
  }
}

function startStyleDnaSignUp() {
  void router.push({ name: 'sign-up', query: { next: '/discover-dna' } });
}

function goToLogin() {
  void router.push({ name: 'login' });
}

function openImageSpread(index: number) {
  const image = inspirationImages.value[index];

  if (!image) {
    return;
  }

  void router.push({
    name: 'image-spread',
    params: { imageId: image.id }
  });
}

async function loadInspirationImages() {
  inspirationImages.value = await getHomeInspirationImages({
    preferredStyles: homePreferredStyles.value
  });
}

onMounted(() => {
  handleScrollLimit();
  window.addEventListener('scroll', handleScrollLimit, { passive: true });
  void loadInspirationImages();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScrollLimit);
});

watch(homePreferredStyles, () => {
  void loadInspirationImages();
});
</script>

<template>
  <main
    class="home-page relative overflow-hidden bg-void text-text-primary [--app-header-height:60px]"
    :style="{ minHeight: containerHeight }"
  >
    <div class="pointer-events-none absolute inset-0 z-0 home-page__wash" aria-hidden="true" />

    <section
      class="relative z-10 pt-[var(--app-header-height)]"
      :style="{ minHeight: containerHeight }"
    >
      <div
        class="absolute inset-x-0 top-[var(--app-header-height)] z-10"
        :style="{ height: containerHeight }"
      >
        <FloatingImageNetwork
          :images="inspirationImages"
          :height="containerHeight"
          layout="home"
          show-constellations
          @click="openImageSpread"
        />
      </div>

      <div class="pointer-events-none relative z-20 pt-[20vh] pl-6 sm:pl-30 sm:pt-[40vh]">
        <h1
          class="text-display max-w-[9ch] tracking-normal text-text-primary [text-shadow:0_4px_24px_rgba(255,255,255,0.18)]"
        >
          Asterism
        </h1>

        <div class="meteor-arrows mt-4 flex translate-x-[10vw]" aria-hidden="true">
          <MoveDownLeft class="meteor-arrow meteor-arrow--primary" />
          <MoveDownLeft class="meteor-arrow meteor-arrow--secondary meteor-arrow--delay-1" />
          <MoveDownLeft class="meteor-arrow meteor-arrow--tertiary meteor-arrow--delay-2" />
        </div>
      </div>
    </section>
    <ModalOverlay
      v-model="isLimitModalOpen"
      max-width="590px"
      :close-on-backdrop="true"
      @close="handleLimitModalClose"
    >
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
        <Button variant="primary" data-testid="cta-create-account" @click="startStyleDnaSignUp">
          Create Free Account
        </Button>
        <Button variant="secondary" data-testid="cta-login" @click="goToLogin">Log In</Button>
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
  opacity: 0.3;
  background-image:
    linear-gradient(rgb(240 237 230 / 0.6) 1px, transparent 1px),
    linear-gradient(90deg, rgb(240 237 230 / 0.6) 1px, transparent 1px);
  background-size: 118px 118px;
  mask-image: linear-gradient(180deg, transparent, black 12%, black 78%, transparent);
}

.meteor-arrow {
  display: block;
  width: clamp(64px, 10vw, 100px);
  height: clamp(64px, 10vw, 100px);
  overflow: visible;
  fill: none;
  stroke: rgb(240 237 230 / var(--meteor-opacity, 0.42));
  stroke-linecap: square;
  stroke-linejoin: miter;
  stroke-width: 0.75;
  animation: meteorArrow 2.4s ease-in-out infinite;
}

.meteor-arrow--primary {
  --meteor-opacity: 0.72;
}

.meteor-arrow--secondary {
  --meteor-opacity: 0.42;
}

.meteor-arrow--tertiary {
  --meteor-opacity: 0.24;
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
    translate: 28px -28px;
  }

  34% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    translate: -18px 18px;
  }
}

@media (max-width: 768px) {
  .meteor-arrows {
    gap: 0;
    transform: translateX(6vw) scale(0.72);
    transform-origin: left center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .meteor-arrow {
    animation-duration: 1ms;
  }
}
</style>
