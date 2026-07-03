<script setup lang="ts">
import { EMPTY_STATE_PREVIEW_PHOTOS } from '@/components/feature/moodboard/config';

const bands = [
  { latitude: -62, count: 5, scale: 0.52 },
  { latitude: -42, count: 7, scale: 0.66 },
  { latitude: -22, count: 9, scale: 0.82 },
  { latitude: 0, count: 10, scale: 0.96 },
  { latitude: 22, count: 9, scale: 0.82 },
  { latitude: 42, count: 7, scale: 0.66 },
  { latitude: 62, count: 5, scale: 0.52 }
];

const cards = bands.flatMap((band, bandIndex) =>
  Array.from({ length: band.count }, (_, index) => {
    const angle = (index * 360) / band.count + bandIndex * 17;
    const photoIndex = (bandIndex * band.count + index) % EMPTY_STATE_PREVIEW_PHOTOS.length;

    return {
      id: `${bandIndex}-${index}`,
      src: EMPTY_STATE_PREVIEW_PHOTOS[photoIndex].src,
      transform: `rotateY(${angle}deg) rotateX(${band.latitude}deg) translateZ(var(--moodboard-orb-radius)) scale(${band.scale})`,
      delay: `${(bandIndex * band.count + index) * -0.12}s`,
      tall: (bandIndex + index) % 4 === 0
    };
  })
);
</script>

<template>
  <section class="moodboard-empty relative h-full overflow-hidden bg-[#050505]">
    <div data-testid="moodboard-empty-sphere" class="moodboard-empty__sphere" aria-hidden="true">
      <div class="moodboard-empty__glow"></div>

      <div class="moodboard-empty__orb">
        <div class="moodboard-empty__shell"></div>

        <div
          v-for="card in cards"
          :key="card.id"
          class="moodboard-empty__card"
          :class="{ 'moodboard-empty__card--tall': card.tall }"
          :style="{
            transform: card.transform,
            animationDelay: card.delay
          }"
        >
          <img class="moodboard-empty__image" :src="card.src" alt="" draggable="false" />
        </div>
      </div>
    </div>

    <div class="relative z-10 flex h-full items-center justify-center px-6 text-center">
      <div class="max-w-xl">
        <p class="mb-5 text-xs tracking-[0.5em] text-[#c49a45]">{{ $t('moodboard.emptyEyebrow') }}</p>

        <h1 class="text-4xl font-semibold leading-tight text-white md:text-6xl">
          {{ $t('moodboard.emptyTitle1') }}<br />
          {{ $t('moodboard.emptyTitle2') }}
        </h1>

        <p class="mt-6 text-base leading-7 text-white/55">
          {{ $t('moodboard.emptyDesc') }}
        </p>

        <RouterLink
          data-testid="moodboard-empty-cta"
          to="/"
          class="mt-8 inline-flex rounded-full bg-[#d96643] px-7 py-3 font-semibold text-white transition hover:bg-[#e67550] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {{ $t('moodboard.startExploring') }}
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.moodboard-empty {
  background:
    radial-gradient(circle at 50% 52%, rgb(198 126 45 / 0.1), transparent 20%),
    radial-gradient(circle at 50% 50%, rgb(255 255 255 / 0.04), transparent 34%), #050505;
}

.moodboard-empty__sphere {
  --moodboard-orb-size: min(620px, 72vw);
  --moodboard-orb-radius: 260px;

  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  perspective: 1200px;
  opacity: 0.9;
  pointer-events: none;
}

.moodboard-empty__glow {
  position: absolute;
  width: var(--moodboard-orb-size);
  aspect-ratio: 1;
  border-radius: 9999px;
  background:
    radial-gradient(circle at 50% 50%, rgb(197 128 54 / 0.18), transparent 22%),
    radial-gradient(circle at 50% 50%, rgb(255 255 255 / 0.06), transparent 52%);
  filter: blur(1px);
}

.moodboard-empty__orb {
  position: relative;
  width: var(--moodboard-orb-size);
  height: var(--moodboard-orb-size);
  transform-style: preserve-3d;
  animation: moodboard-empty-spin 22s linear infinite;
}

.moodboard-empty__shell {
  position: absolute;
  inset: 7%;
  border-radius: 9999px;
  background:
    radial-gradient(
      circle at 50% 48%,
      transparent 42%,
      rgb(255 255 255 / 0.045) 43%,
      transparent 64%
    ),
    radial-gradient(circle at 50% 50%, rgb(255 255 255 / 0.025), transparent 68%);
  transform: translateZ(-24px);
}

.moodboard-empty__card {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 108px;
  height: 140px;
  margin: -70px 0 0 -54px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 10px;
  background: linear-gradient(180deg, rgb(255 255 255 / 0.1), rgb(255 255 255 / 0.025));
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.1),
    0 18px 42px rgb(0 0 0 / 0.4);
  opacity: 0.3;
  overflow: hidden;
  transform-style: preserve-3d;
  animation: moodboard-empty-pulse 4s ease-in-out infinite;
}

.moodboard-empty__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.16;
  filter: grayscale(1) brightness(0.55);
}

.moodboard-empty__card--tall {
  height: 172px;
  margin-top: -86px;
}

@keyframes moodboard-empty-spin {
  from {
    transform: rotateX(-10deg) rotateY(0deg);
  }

  to {
    transform: rotateX(-10deg) rotateY(-360deg);
  }
}

@keyframes moodboard-empty-pulse {
  0%,
  100% {
    opacity: 0.26;
  }

  50% {
    opacity: 0.42;
  }
}

@media (max-width: 760px) {
  .moodboard-empty__sphere {
    --moodboard-orb-size: min(520px, 120vw);
    --moodboard-orb-radius: 210px;

    perspective: 900px;
  }

  .moodboard-empty__card {
    width: 92px;
    height: 118px;
    margin: -59px 0 0 -46px;
  }

  .moodboard-empty__card--tall {
    height: 148px;
    margin-top: -74px;
  }
}

@media (max-width: 480px) {
  .moodboard-empty__sphere {
    --moodboard-orb-size: min(460px, 128vw);
    --moodboard-orb-radius: 180px;
  }

  .moodboard-empty__card {
    width: 76px;
    height: 98px;
    margin: -49px 0 0 -38px;
  }

  .moodboard-empty__card--tall {
    height: 124px;
    margin-top: -62px;
  }
}
</style>
