<script setup lang="ts">
import { useRouter } from 'vue-router'
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue'
import DnaIntroHero from '@/components/feature/dna/DnaIntroHero.vue'

const router = useRouter()

function startQuiz() {
  void router.push('/style-dna')
}

function skipIntro() {
  void router.push('/')
}
</script>

<template>
  <main class="discover-dna-page">
    <div class="discover-dna-page__wash" aria-hidden="true" />

    <div class="discover-dna-page__stars" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>

    <div class="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
      <div class="discover-dna-page__constellation discover-dna-page__constellation--primary">
        <ConstellationBackground
          :size="560"
          class-name="discover-dna-constellation"
          :node-size="6"
          :center-size="12"
          :spacing="50"
          :line-length="250"
          :line-width="1.2"
          :line-opacity="0.34"
          :active-node-opacity="0.45"
          :inactive-node-opacity="0.1"
          :intensity="0.5"
        />
      </div>
      <div class="discover-dna-page__constellation discover-dna-page__constellation--secondary">
        <ConstellationBackground
          :size="500"
          class-name="discover-dna-constellation"
          :node-size="4.5"
          :center-size="10"
          :spacing="48"
          :line-length="220"
          :line-width="1"
          :line-opacity="0.22"
          :active-node-opacity="0.34"
          :inactive-node-opacity="0.08"
          :intensity="0.4"
        />
      </div>
    </div>

    <div class="discover-dna-page__content">
      <DnaIntroHero @start="startQuiz" @skip="skipIntro" />
    </div>
  </main>
</template>

<style scoped>
.discover-dna-page {
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: var(--color-void);
  color: var(--color-text-primary);
}

.discover-dna-page__wash {
  position: fixed;
  inset: 0;
  z-index: 10;
  background:
    radial-gradient(circle at center, rgb(240 237 230 / 0.1), transparent 38%),
    linear-gradient(180deg, rgb(6 6 8 / 0.86), rgb(6 6 8 / 0.96));
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.discover-dna-page__content {
  position: relative;
  z-index: 30;
  display: grid;
  height: 100vh;
  place-items: center;
}

.discover-dna-page__constellation {
  position: absolute;
  transform: translate(-50%, -50%);
}

.discover-dna-page__constellation--primary {
  top: 46%;
  left: 63%;
}

.discover-dna-page__constellation--secondary {
  top: 85%;
  left: 12%;
  opacity: 0.6;
}

.discover-dna-page__stars {
  position: fixed;
  inset: 0;
  z-index: 15;
  pointer-events: none;
}

.discover-dna-page__stars span {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 9999px;
  background: var(--color-text-primary);
  opacity: 0.18;
  box-shadow: 0 0 10px rgb(240 237 230 / 0.3);
}

.discover-dna-page__stars span:nth-child(1) {
  top: 12%;
  left: 74%;
}

.discover-dna-page__stars span:nth-child(2) {
  top: 18%;
  left: 57%;
}

.discover-dna-page__stars span:nth-child(3) {
  top: 22%;
  left: 86%;
  width: 3px;
  height: 3px;
}

.discover-dna-page__stars span:nth-child(4) {
  top: 51%;
  left: 88%;
}

.discover-dna-page__stars span:nth-child(5) {
  top: 35%;
  left: 24%;
  width: 3px;
  height: 3px;
}

.discover-dna-page__stars span:nth-child(6) {
  top: 68%;
  left: 72%;
  width: 4px;
  height: 4px;
}

.discover-dna-page__stars span:nth-child(7) {
  top: 74%;
  left: 90%;
  width: 3px;
  height: 3px;
}

.discover-dna-page__stars span:nth-child(8) {
  top: 8%;
  left: 52%;
  width: 2px;
  height: 2px;
}

:deep(.discover-dna-constellation) {
  animation: discover-dna-fade-in 1500ms ease infinite alternate;
}

:deep(.discover-dna-constellation .constellation-background__canvas) {
  animation: discover-dna-scale-in 620ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes discover-dna-fade-in {
  from {
    opacity: 0.6;
  }
  to {
    opacity: 1;
  }
}

@keyframes discover-dna-scale-in {
  from {
    transform: scale(0.82);
  }
  to {
    transform: scale(1);
  }
}

@media (max-width: 760px) {
  .discover-dna-page {
    overflow: hidden;
  }

  .discover-dna-page__constellation--primary {
    top: 42%;
    left: 70%;
  }

  .discover-dna-page__constellation--secondary {
    top: 86%;
    left: 16%;
  }
}
</style>
