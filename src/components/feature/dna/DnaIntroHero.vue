<script setup lang="ts">
import Button from '@/components/ui/Button.vue'

defineEmits<{
  start: []
  skip: []
}>()
</script>

<template>
  <section class="dna-intro-hero" aria-labelledby="dna-intro-title">
    <div class="dna-intro-hero__copy">
      <h1 id="dna-intro-title" class="dna-intro-hero__title">
        <span>Discover</span>
        <span>Your Style DNA</span>
      </h1>

      <div class="dna-intro-hero__panel glass-panel">
        <p class="dna-intro-hero__description">
          Asterism personalizes your visual feed by cataloging your stylistic preferences.
          Embark on a 4-stage blind selection process to extract your architectural and sensory
          style values.
        </p>

        <div class="dna-intro-hero__actions">
          <Button type="button" data-testid="start-dna-cta" @click="$emit('start')">
            PARTICIPATE
          </Button>
          <Button type="button" variant="secondary" @click="$emit('skip')">SKIP</Button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dna-intro-hero {
  --dna-intro-panel-width: 820px;

  position: relative;
  width: min(100%, 960px);
  height: min(100vh, 720px);
  margin-inline: auto;
  padding: 48px 24px 32px;
}

.dna-intro-hero__copy {
  position: relative;
  z-index: 2;
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 16px;
}

.dna-intro-hero__title {
  display: flex;
  width: min(100%, var(--dna-intro-panel-width));
  flex-direction: column;
  gap: 12px;
  margin: 0;
  font-family: var(--font-family-title);
  font-size: 6.5rem;
  font-weight: 200;
  line-height: 1.12;
  letter-spacing: 0;
  text-align: left;
  text-shadow: 0 18px 34px rgb(0 0 0 / 0.32);
}

.dna-intro-hero__title span:last-child {
  align-self: flex-end;
  text-align: right;
  transform: none;
}

.dna-intro-hero__panel {
  width: min(100%, var(--dna-intro-panel-width));
  margin-top: 58px;
  padding: 56px 72px 34px;
  text-align: center;
}

.dna-intro-hero__description {
  max-width: 620px;
  margin: 0 auto;
  color: rgb(240 237 230 / 0.72);
  font-size: var(--text-caption);
  line-height: 1.55;
}

.dna-intro-hero__actions {
  display: flex;
  justify-content: center;
  gap: 64px;
  margin-top: 32px;
}

.dna-intro-hero__actions :deep(button) {
  min-width: 116px;
  padding: 10px 24px;
  font-family: var(--font-family-mono);
  font-size: 10px;
  letter-spacing: 0.18em;
}

.dna-intro-hero__actions :deep(button:first-child) {
  background: var(--color-text-secondary);
  color: var(--color-deep);
}

@media (max-width: 760px) {
  .dna-intro-hero {
    height: 100vh;
    padding: 24px 20px 24px;
  }

  .dna-intro-hero__copy {
    justify-content: center;
    padding-top: 36px;
  }

  .dna-intro-hero__title {
    width: min(100%, var(--dna-intro-panel-width));
    font-size: 4rem;
  }

  .dna-intro-hero__title span:last-child {
    align-self: flex-start;
    text-align: left;
  }

  .dna-intro-hero__panel {
    margin-top: 42px;
    padding: 44px 24px 30px;
  }

  .dna-intro-hero__actions {
    flex-direction: column;
    gap: 14px;
    margin-top: 28px;
  }
}
</style>
