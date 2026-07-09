<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { starLinks } from './config';
import type { HomeStarLinkKey } from './config';

const router = useRouter();
const { t } = useI18n();
const activeStarLink = ref<HomeStarLinkKey | null>(null);
const starLinksRef = ref<HTMLElement | null>(null);

function usesTapTooltip() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(hover: none), (pointer: coarse)').matches;
}

function closeLegalTooltip() {
  activeStarLink.value = null;
}

function handleStarClick(event: MouseEvent, link: HomeStarLinkKey) {
  if (usesTapTooltip()) {
    event.preventDefault();
    event.stopPropagation();
    activeStarLink.value = activeStarLink.value === link ? null : link;
    return;
  }

  void router.push({ name: link });
}

function handleDocumentPointerDown(event: PointerEvent) {
  const target = event.target;

  if (target instanceof Node && starLinksRef.value?.contains(target)) {
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
  <nav ref="starLinksRef" class="home-star-links" :aria-label="t('legalLinks.ariaLabel')">
    <template v-for="link in starLinks" :key="link.key">
      <button
        type="button"
        class="home-star-links__button"
        :style="link.style"
        :aria-label="t(`legalLinks.${link.key}`)"
        aria-haspopup="true"
        :aria-expanded="activeStarLink === link.key"
        :data-testid="`home-${link.key}-star`"
        @click="handleStarClick($event, link.key)"
      >
        <span class="home-star-links__core" aria-hidden="true" />
      </button>
      <RouterLink
        :to="{ name: link.routeName }"
        class="home-star-links__label"
        :class="{ 'home-star-links__label--active': activeStarLink === link.key }"
        :style="link.style"
        :data-testid="`home-${link.key}-tooltip-link`"
        @click="closeLegalTooltip"
      >
        {{ t(`legalLinks.${link.key}`) }}
      </RouterLink>
    </template>
  </nav>
</template>

<style scoped>
.home-star-links {
  --star-hit-size: 50px;

  position: absolute;
  top: calc(var(--app-header-height) + clamp(14px, 3vw, 28px));
  left: clamp(14px, 3vw, 32px);
  z-index: 35;
  width: 190px;
  height: 160px;
  pointer-events: auto;
}

.home-star-links__button {
  position: absolute;
  top: var(--star-top);
  left: var(--star-left);
  display: grid;
  width: var(--star-hit-size);
  height: var(--star-hit-size);
  place-items: center;
  border-radius: 9999px;
  color: var(--star-color);
  cursor: pointer;
  touch-action: manipulation;
}

.home-star-links__button:focus-visible {
  outline: 1px solid rgb(240 237 230 / 0.5);
  outline-offset: 4px;
}

.home-star-links__core {
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

.home-star-links__button:hover .home-star-links__core,
.home-star-links__button:focus-visible .home-star-links__core {
  box-shadow: var(--star-hover-glow);
}

.home-star-links__label {
  position: absolute;
  top: calc(var(--star-top) + var(--star-hit-size) / 2);
  left: calc(var(--star-left) + 48px);
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

.home-star-links__button:hover + .home-star-links__label,
.home-star-links__button:focus-visible + .home-star-links__label,
.home-star-links__label:hover,
.home-star-links__label:focus-visible,
.home-star-links__label--active {
  opacity: 1;
  pointer-events: auto;
  transform: translate(0, -50%);
}

@media (max-width: 640px) {
  .home-star-links {
    --star-hit-size: 60px;

    top: calc(var(--app-header-height) + 10px);
    left: 10px;
    width: 124px;
    height: 90px;
  }

  .home-star-links__button {
    top: var(--star-mobile-top, var(--star-top));
    left: var(--star-mobile-left, var(--star-left));
  }

  .home-star-links__label {
    top: calc(var(--star-mobile-top, var(--star-top)) + var(--star-hit-size) / 2);
    left: calc(var(--star-mobile-left, var(--star-left)) + 48px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-star-links__core {
    animation: none;
  }
}
</style>
