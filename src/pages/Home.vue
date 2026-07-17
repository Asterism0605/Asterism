<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Lock, MoveDownLeft } from '@lucide/vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import Button from '@/components/ui/Button.vue';
import ModalOverlay from '@/components/overlay/ModalOverlay.vue';
import FloatingImageNetwork from '@/components/sections/FloatingImageNetwork';
import HomeStarLinks from '@/components/sections/HomeStarLinks';
import HomeImageClickGuide from '@/components/feature/guide/HomeImageClickGuide.vue';
import HomeTourIntro from '@/components/feature/guide/HomeTourIntro.vue';
import { useHomeTourFlow } from '@/composables/guide/useHomeTourFlow';
import { useHomeImageGuide } from '@/composables/guide/useHomeImageGuide';
import { usePageUserTour } from '@/composables/guide/usePageUserTour';
import { getHomeInspirationImages } from '@/services/image.service';
import { useAuthStore } from '@/stores/auth.store';
import { useStyleDnaStore } from '@/stores/style-dna.store';
import type { HomeInspirationImage } from '@/types/image';

const scrollLimitVh = 150;
const router = useRouter();
const authStore = useAuthStore();
const styleDnaStore = useStyleDnaStore();
const { isAuthenticated } = storeToRefs(authStore);
const isLimitModalOpen = ref(false);
const hasTriggeredLimit = ref(false);
const showGuestHint = ref(false);
const inspirationImages = ref<HomeInspirationImage[]>([]);
const coreGuideTargetIndex = ref<number | null>(null);
const userId = computed(() => authStore.user?.id);
const coreTour = usePageUserTour(userId);
const { findTargetIndex } = useHomeImageGuide();

const HOME_DENSITY_PER_100VH = 3;
const homePreferredStyles = computed(() =>
  styleDnaStore.hasCompletedQuiz ? styleDnaStore.preferredStyles : []
);
const {
  isHomeTourVisible,
  isImageGuideVisible,
  guideTargetIndex,
  completeGuide,
  handleHomeTourStart,
  handleHomeTourExplore,
  handleImageNetworkReady
} = useHomeTourFlow(isAuthenticated, userId);
const isCoreHomeTourActive = computed(
  () =>
    coreTour.state.value.status === 'active' &&
    (coreTour.state.value.step === 'home-overview' || coreTour.state.value.step === 'home-image')
);
const activeGuideTargetIndex = computed(() =>
  isImageGuideVisible.value
    ? guideTargetIndex.value
    : isCoreHomeTourActive.value
      ? coreGuideTargetIndex.value
      : null
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

function clampGuestToLimit(): void {
  if (typeof window === 'undefined' || authStore.isAuthenticated) {
    return;
  }

  const limitTop = getGuestScrollLimitTop();
  if (window.scrollY > limitTop) {
    window.scrollTo({ top: limitTop, behavior: 'auto' });
  }
}

function openLimitModal() {
  if (hasTriggeredLimit.value) {
    return;
  }

  hasTriggeredLimit.value = true;
  isLimitModalOpen.value = true;
}

function handleLimitModalClose() {
  // Soft Gate：關閉後不回頂、不重複彈窗，改用 header 區淡提示引導，並把訪客留在限制範圍內。
  showGuestHint.value = true;
  clampGuestToLimit();
}

function handleScrollLimit() {
  if (typeof window === 'undefined' || authStore.isAuthenticated) {
    return;
  }

  const limit = getGuestScrollLimitTop() + window.innerHeight;
  const viewportBottom = window.scrollY + window.innerHeight;

  if (viewportBottom < limit) {
    return;
  }

  if (!hasTriggeredLimit.value) {
    openLimitModal();
    return;
  }

  // 已提示過：不再彈窗。modal 開著時捲動已被鎖、不處理；關閉後顯示 header 區淡提示並把訪客夾在限制處。
  if (!isLimitModalOpen.value) {
    showGuestHint.value = true;
    clampGuestToLimit();
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

  if (isImageGuideVisible.value && index === guideTargetIndex.value) {
    completeGuide();
  }

  if (
    coreTour.state.value.status === 'active' &&
    coreTour.state.value.step === 'home-image' &&
    index === coreGuideTargetIndex.value
  ) {
    coreTour.advance('spread-center', image.id);
    coreTour.destroy();
  }

  void router.push({
    name: 'image-spread',
    params: { imageId: image.id }
  });
}

function prepareCoreTourTarget(): number | null {
  const targetIndex = findTargetIndex();
  coreGuideTargetIndex.value = targetIndex;
  return targetIndex;
}

async function showCurrentHomeTourStep(): Promise<void> {
  const step = coreTour.state.value.step;
  if (coreTour.state.value.status !== 'active') {
    return;
  }

  if (step !== 'home-overview' && step !== 'home-image') {
    coreTour.pause();
    return;
  }

  prepareCoreTourTarget();
  await coreTour.showStep(step);
}

async function startCoreTour(): Promise<void> {
  handleHomeTourStart();
  const targetIndex = prepareCoreTourTarget();
  const targetImageId = targetIndex === null ? undefined : inspirationImages.value[targetIndex]?.id;
  coreTour.start(targetImageId);
  await coreTour.showStep('home-overview');
}

function exploreWithoutTour(): void {
  handleHomeTourExplore();
  coreTour.optOut();
  coreTour.destroy();
}

function handleHomeImagesReady(): void {
  handleImageNetworkReady();
  if (!isAuthenticated.value) return;

  if (coreGuideTargetIndex.value !== null) {
    coreTour.refresh();
    return;
  }

  void showCurrentHomeTourStep();
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

watch(
  () => coreTour.state.value.status,
  (status) => {
    if (status !== 'active') coreGuideTargetIndex.value = null;
  }
);
</script>

<template>
  <main
    class="home-page relative overflow-hidden bg-void text-text-primary [--app-header-height:60px]"
    :style="{ minHeight: containerHeight }"
  >
    <div class="pointer-events-none absolute inset-0 z-0 home-page__wash" aria-hidden="true" />

    <section
      class="relative z-10 pt-[var(--app-header-height)]"
      data-tour="home-overview"
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
          :guide-target-index="activeGuideTargetIndex ?? undefined"
          @click="openImageSpread"
          @ready="handleHomeImagesReady"
          @guide-target-ready="handleHomeImagesReady"
        />
      </div>

      <div class="pointer-events-none relative z-20 pt-[20vh] pl-6 sm:pl-30 sm:pt-[40vh]">
        <h1
          class="text-display max-w-[9ch] tracking-normal text-text-primary [text-shadow:0_4px_24px_rgba(255,255,255,0.18)]"
        >
          Asterism
        </h1>

        <div
          v-if="!isImageGuideVisible && !isCoreHomeTourActive"
          class="meteor-arrows mt-4 flex translate-x-[10vw]"
          data-testid="home-meteor-arrows"
          aria-hidden="true"
        >
          <MoveDownLeft class="meteor-arrow meteor-arrow--primary" />
          <MoveDownLeft class="meteor-arrow meteor-arrow--secondary meteor-arrow--delay-1" />
          <MoveDownLeft class="meteor-arrow meteor-arrow--tertiary meteor-arrow--delay-2" />
        </div>
      </div>
    </section>

    <HomeStarLinks />

    <HomeTourIntro
      v-if="isHomeTourVisible"
      :description="$t('home.tour.description')"
      :start-label="$t('home.tour.startTour')"
      :explore-label="$t('home.tour.exploreOnMyOwn')"
      @start="startCoreTour"
      @explore="exploreWithoutTour"
    />

    <HomeImageClickGuide
      v-if="isImageGuideVisible && guideTargetIndex !== null"
      :target-index="guideTargetIndex"
      @dismiss="completeGuide"
    />

    <Transition name="guest-hint">
      <p
        v-if="showGuestHint && !authStore.isAuthenticated"
        class="home-page__guest-hint"
        role="status"
      >
        {{ $t('home.guestHint') }}
      </p>
    </Transition>

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

      <template #title>{{ $t('home.limitTitle') }}</template>

      <template #description>
        {{ $t('home.limitDesc') }}
      </template>

      <template #actions>
        <Button variant="primary" data-testid="cta-create-account" @click="startStyleDnaSignUp">
          {{ $t('home.createAccount') }}
        </Button>
        <Button variant="secondary" data-testid="cta-login" @click="goToLogin">{{ $t('home.login') }}</Button>
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

/* 限制觸發後的淡提示：貼在 header 下緣，引導到右上 Sign Up / Log in，不蓋版、不打斷瀏覽。 */
.home-page__guest-hint {
  position: fixed;
  top: calc(var(--app-header-height) + 14px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  padding: 8px 18px;
  border: 1px solid rgb(240 237 230 / 0.12);
  border-radius: 9999px;
  background: rgb(20 20 24 / 0.55);
  backdrop-filter: blur(8px);
  color: rgb(240 237 230 / 0.78);
  font-size: 0.8rem;
  letter-spacing: 0.02em;
  white-space: nowrap;
  pointer-events: none;
}

.guest-hint-enter-active,
.guest-hint-leave-active {
  transition:
    opacity 320ms ease,
    transform 320ms ease;
}

.guest-hint-enter-from,
.guest-hint-leave-to {
  opacity: 0;
  transform: translate(-50%, -6px);
}

.guest-hint-enter-to,
.guest-hint-leave-from {
  opacity: 1;
  transform: translateX(-50%);
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
