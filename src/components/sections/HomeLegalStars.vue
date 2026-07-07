<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

type LegalLink = 'privacy' | 'terms';

const router = useRouter();
const { t } = useI18n();
const activeLegalLink = ref<LegalLink | null>(null);
const legalStarsRef = ref<HTMLElement | null>(null);

function usesTapTooltip() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(hover: none), (pointer: coarse)').matches;
}

function closeLegalTooltip() {
  activeLegalLink.value = null;
}

function handleStarClick(event: MouseEvent, link: LegalLink) {
  if (usesTapTooltip()) {
    event.preventDefault();
    event.stopPropagation();
    activeLegalLink.value = activeLegalLink.value === link ? null : link;
    return;
  }

  void router.push({ name: link });
}

function handleDocumentPointerDown(event: PointerEvent) {
  const target = event.target;

  if (target instanceof Node && legalStarsRef.value?.contains(target)) {
    return;
  }

  closeLegalTooltip();
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown);
});
</script>

<template>
  <nav ref="legalStarsRef" class="home-legal-stars" :aria-label="t('legalLinks.ariaLabel')">
    <div
      class="home-legal-star-item home-legal-star-item--privacy"
      :class="{ 'home-legal-star-item--active': activeLegalLink === 'privacy' }"
    >
      <button
        type="button"
        class="home-legal-star"
        :aria-label="t('legalLinks.privacy')"
        aria-haspopup="true"
        :aria-expanded="activeLegalLink === 'privacy'"
        data-testid="home-privacy-star"
        @click="handleStarClick($event, 'privacy')"
      >
        <span class="home-legal-star__core" aria-hidden="true" />
      </button>
      <RouterLink
        :to="{ name: 'privacy' }"
        class="home-legal-star__label"
        data-testid="home-privacy-tooltip-link"
        @click="closeLegalTooltip"
      >
        {{ t('legalLinks.privacy') }}
      </RouterLink>
    </div>

    <div
      class="home-legal-star-item home-legal-star-item--terms"
      :class="{ 'home-legal-star-item--active': activeLegalLink === 'terms' }"
    >
      <button
        type="button"
        class="home-legal-star"
        :aria-label="t('legalLinks.terms')"
        aria-haspopup="true"
        :aria-expanded="activeLegalLink === 'terms'"
        data-testid="home-terms-star"
        @click="handleStarClick($event, 'terms')"
      >
        <span class="home-legal-star__core" aria-hidden="true" />
      </button>
      <RouterLink
        :to="{ name: 'terms' }"
        class="home-legal-star__label"
        data-testid="home-terms-tooltip-link"
        @click="closeLegalTooltip"
      >
        {{ t('legalLinks.terms') }}
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.home-legal-stars {
  --star-hit-size: 50px;

  position: absolute;
  top: calc(var(--app-header-height) + clamp(14px, 3vw, 28px));
  left: clamp(14px, 3vw, 32px);
  z-index: 35;
  width: 190px;
  height: 160px;
  pointer-events: auto;
}

.home-legal-star-item {
  position: absolute;
  top: var(--star-top);
  left: var(--star-left);
  color: var(--star-color);
}

.home-legal-star-item--privacy {
  --star-top: 30px;
  --star-left: 40px;
  --star-size: 7px;
  --star-color: rgb(240 237 230 / 0.86);
  --star-hover-glow:
    0 0 50px rgb(240 237 230 / 0.98), 0 0 38px rgb(168 137 58 / 0.7),
    0 0 62px rgb(168 137 58 / 0.34);
  --star-float-delay: 0s;
}

.home-legal-star-item--terms {
  --star-top: 100px;
  --star-left: 130px;
  --star-size: 5px;
  --star-color: rgb(240 237 230 / 0.74);
  --star-glow: 0 0 9px rgb(240 237 230 / 0.72), 0 0 22px rgb(196 92 58 / 0.34);
  --star-hover-glow:
    0 0 13px rgb(240 237 230 / 0.92), 0 0 34px rgb(196 92 58 / 0.6), 0 0 56px rgb(196 92 58 / 0.28);
  --star-float-delay: 1.1s;
}

.home-legal-star {
  position: relative;
  display: grid;
  width: var(--star-hit-size);
  height: var(--star-hit-size);
  place-items: center;
  border-radius: 9999px;
  color: inherit;
  cursor: pointer;
  touch-action: manipulation;
}

.home-legal-star:focus-visible {
  outline: 1px solid rgb(240 237 230 / 0.5);
  outline-offset: 4px;
}

.home-legal-star__core {
  position: relative;
  z-index: 1;
  width: var(--star-size);
  height: var(--star-size);
  border-radius: 999px;
  background: currentcolor;
  box-shadow: var(--star-glow);
  animation: floatY 4.3s ease-in-out infinite;
  animation-delay: var(--star-float-delay);
  transition: box-shadow 180ms ease;
}

.home-legal-star:hover .home-legal-star__core,
.home-legal-star:focus-visible .home-legal-star__core {
  box-shadow: var(--star-hover-glow);
}

.home-legal-star__label {
  position: absolute;
  top: 50%;
  left: 48px;
  color: rgb(240 237 230 / 0.82);
  font-size: 0.78rem;
  line-height: 1.2;
  opacity: 0;
  pointer-events: none;
  white-space: nowrap;
  transform: translate(-6px, -50%);
  transform-origin: left center;
  transition:
    opacity 170ms ease,
    transform 170ms ease;
  text-shadow: 0 0 12px rgb(240 237 230 / 0.22);
}

@keyframes floatY {
  0%,
  100% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-6px);
  }
}

.home-legal-star-item:hover .home-legal-star__label,
.home-legal-star-item:focus-within .home-legal-star__label,
.home-legal-star-item--active .home-legal-star__label {
  opacity: 1;
  pointer-events: auto;
  transform: translate(0, -50%);
}

@media (max-width: 640px) {
  .home-legal-stars {
    --star-hit-size: 60px;

    top: calc(var(--app-header-height) + 10px);
    left: 10px;
    width: 124px;
    height: 90px;
  }

  .home-legal-star-item--privacy {
    --star-top: 70px;
    --star-left: 50px;
  }

  .home-legal-star-item--terms {
    --star-top: 20px;
    --star-left: 0px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-legal-star__core {
    animation: none;
  }
}
</style>
