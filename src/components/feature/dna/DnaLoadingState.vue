<template>
  <main class="dna-loading-state relative min-h-screen overflow-hidden bg-deep text-text-primary">
    <div class="dna-loading-state__atmosphere" aria-hidden="true">
      <span class="dna-loading-state__dot dna-loading-state__dot--one"></span>
      <span class="dna-loading-state__dot dna-loading-state__dot--two"></span>
      <span class="dna-loading-state__dot dna-loading-state__dot--three"></span>
      <span class="dna-loading-state__dot dna-loading-state__dot--four"></span>
      <span class="dna-loading-state__line dna-loading-state__line--one"></span>
      <span class="dna-loading-state__line dna-loading-state__line--two"></span>
      <span class="dna-loading-state__line dna-loading-state__line--three"></span>
    </div>

    <section
      class="relative z-10 flex min-h-[calc(100vh-72px)] items-center justify-center px-6 pb-20"
    >
      <h1
        class="dna-loading-state__title text-center text-[52px] font-semibold leading-[0.95] sm:text-[78px] md:text-[104px]"
      >
        <span class="dna-loading-state__title-line block">{{ $t('dna.loadingLine1') }}</span>
        <span class="dna-loading-state__title-line dna-loading-state__title-line--delay block">
          {{ $t('dna.loadingLine2') }}
        </span>
      </h1>
    </section>
  </main>
</template>

<style scoped>
.dna-loading-state {
  background:
    radial-gradient(circle at 50% 52%, rgb(168 137 58 / 0.14), transparent 24rem),
    radial-gradient(circle at 18% 22%, rgb(196 92 58 / 0.13), transparent 20rem), #0e0e12;
}

.dna-loading-state__atmosphere {
  position: absolute;
  inset: 0;
  opacity: 0.72;
}

.dna-loading-state__dot,
.dna-loading-state__line {
  position: absolute;
  display: block;
  pointer-events: none;
}

.dna-loading-state__dot {
  width: 5px;
  height: 5px;
  border-radius: 9999px;
  background: rgb(240 237 230 / 0.72);
  box-shadow: 0 0 18px rgb(168 137 58 / 0.38);
}

.dna-loading-state__dot--one {
  left: 17%;
  top: 28%;
}

.dna-loading-state__dot--two {
  right: 21%;
  top: 23%;
}

.dna-loading-state__dot--three {
  left: 28%;
  bottom: 22%;
}

.dna-loading-state__dot--four {
  right: 30%;
  bottom: 31%;
}

.dna-loading-state__line {
  height: 1px;
  transform-origin: left center;
  background: linear-gradient(90deg, transparent, rgb(168 137 58 / 0.42), transparent);
}

.dna-loading-state__line--one {
  left: 17%;
  top: 29%;
  width: 22vw;
  transform: rotate(-9deg);
}

.dna-loading-state__line--two {
  right: 21%;
  top: 24%;
  width: 18vw;
  transform: rotate(26deg);
}

.dna-loading-state__line--three {
  left: 28%;
  bottom: 23%;
  width: 28vw;
  transform: rotate(14deg);
}

.dna-loading-state__title {
  text-shadow:
    0 0 18px rgb(240 237 230 / 0.12),
    0 0 38px rgb(168 137 58 / 0.18);
}

.dna-loading-state__title-line {
  display: block;
  color: transparent;
  background:
    linear-gradient(
      100deg,
      rgb(97 96 102 / 0.42) 0%,
      rgb(166 164 170 / 0.62) 24%,
      rgb(240 237 230 / 0.98) 43%,
      rgb(166 164 170 / 0.62) 62%,
      rgb(72 72 78 / 0.4) 100%
    );
  background-size: 260% 100%;
  background-position: 130% 50%;
  -webkit-background-clip: text;
  background-clip: text;
  animation: dna-title-wave 2.6s cubic-bezier(0.42, 0, 0.28, 1) infinite;
  filter: drop-shadow(0 0 18px rgb(240 237 230 / 0.16));
}

.dna-loading-state__title-line--delay {
  animation-delay: 0.18s;
}

@keyframes dna-title-wave {
  0%,
  100% {
    background-position: 130% 50%;
    opacity: 0.62;
    transform: translateY(0);
  }

  24% {
    opacity: 0.84;
  }

  48% {
    background-position: 50% 50%;
    opacity: 1;
    transform: translateY(-2px);
  }

  72% {
    background-position: -30% 50%;
    opacity: 0.78;
    transform: translateY(1px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dna-loading-state__title-line {
    animation: none;
    background-position: 50% 50%;
    opacity: 1;
  }
}
</style>
