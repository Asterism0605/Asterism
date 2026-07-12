<script setup lang="ts">
import ScrambleText from '@/components/effects/ScrambleText.vue';
import type { AccountConsultation } from '@/types/account-consultation';

defineProps<{
  reservations: AccountConsultation[];
  selectedId: string;
  showAll: boolean;
}>();

const emit = defineEmits<{
  select: [reservationId: string];
}>();

function displayDate(date: string): string {
  return date.replaceAll('-', ' ');
}
</script>

<template>
  <header class="page-heading">
    <span class="page-heading__line" aria-hidden="true"></span>
    <p>
      You have
      {{ ' ' }}
      <ScrambleText
        class="consultation-count"
        :text="reservations.length"
        chars="0123456789"
        :duration="1.8"
        :delay="0.2"
      />
      {{ ' ' }} upcoming
      {{ ' ' }}
      <ScrambleText
        class="consultation-label"
        text="consultations"
        chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
        :duration="1.8"
        :delay="0.2"
      />
    </p>
  </header>

  <nav class="date-timeline" aria-label="Upcoming consultation dates">
    <div class="date-timeline__viewport">
      <div class="date-timeline__list">
        <button
          v-for="reservation in reservations"
          :key="reservation.id"
          type="button"
          class="date-node"
          :class="{
            'date-node--active': !showAll && reservation.id === selectedId
          }"
          :aria-current="!showAll && reservation.id === selectedId ? 'date' : undefined"
          @click="emit('select', reservation.id)"
        >
          <span class="date-node__anchor" aria-hidden="true"></span>
          <span class="date-node__connector" aria-hidden="true"></span>
          <span class="date-node__end" aria-hidden="true"></span>
          <span class="date-node__label">
            {{ displayDate(reservation.consultationDate) }}
            {{ reservation.timeSlot.toUpperCase() }}
          </span>
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.consultation-count,
.consultation-label {
  display: inline-block;
  font-weight: 500;
}

.consultation-count {
  font-variant-numeric: tabular-nums;
}

.consultation-label {
  width: 6.85em;
  overflow: hidden;
  vertical-align: bottom;
  white-space: nowrap;
}

.page-heading {
  position: absolute;
  left: 12%;
  top: 16%;
  z-index: 4;
  display: flex;
  align-items: center;
}

.page-heading__line {
  display: block;
  width: 140px;
  height: 32px;
  clip-path: polygon(0 100%, 38% 0, 100% 0, 100% 4%, 39% 4%, 1% 100%);
  background: #f0ede6bf;
  transform: translateY(24px);
}

.page-heading p {
  position: relative;
  top: 10px;
  margin: 0 0 0 20px;
  font-size: 20px;
  font-weight: 300;
  letter-spacing: 0.015em;
}

.date-timeline {
  position: absolute;
  left: 12%;
  top: 0;
  z-index: 4;
  width: 430px;
  height: 100%;
}

.date-timeline__viewport {
  position: absolute;
  left: -16px;
  top: 30%;
  width: 446px;
  height: 264px;
  overflow: hidden auto;
  padding-left: 16px;
  overscroll-behavior: contain;
  scrollbar-width: none;
}

.date-timeline__viewport::-webkit-scrollbar {
  display: none;
}

.date-timeline__list {
  display: grid;
  width: 100%;
}

.date-node {
  position: relative;
  display: flex;
  align-items: center;
  width: 420px;
  height: 88px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f0ede6bd;
  font: inherit;
  cursor: pointer;
  opacity: 0.5;
  transition:
    color 180ms ease,
    filter 180ms ease,
    opacity 180ms ease;
}

.date-node:is(:hover, :focus-visible) {
  filter: drop-shadow(0 0 7px #f0ede657);
}

.date-node__anchor,
.date-node__end {
  border-radius: 50%;
  background: #f0ede6eb;
}

.date-node__anchor {
  width: 10px;
  height: 10px;
  margin-left: -5px;
  transition:
    box-shadow 180ms ease,
    transform 180ms ease;
}

.date-node__connector {
  width: 88px;
  height: 1px;
  background: #f0ede6c2;
  transition:
    background-color 180ms ease,
    width 220ms ease;
}

.date-node__end {
  width: 5px;
  height: 5px;
}

.date-node__label {
  margin-left: 12px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.025em;
  white-space: nowrap;
}

.date-node:not(.date-node--active):is(:hover, :focus-visible) {
  color: #f0ede6d6;
  opacity: 0.76;
}

.date-node:not(.date-node--active):is(:hover, :focus-visible) .date-node__anchor {
  transform: scale(1.08);
}

.date-node--active {
  color: var(--color-text-primary);
  opacity: 1;
}

.date-node--active .date-node__anchor {
  box-shadow:
    0 0 0 1px #f0ede68c,
    0 0 10px #f0ede62e;
  transform: scale(1.15);
}

.date-node--active .date-node__connector {
  background: #f0ede6e6;
}

@media (max-width: 768px) {
  .page-heading {
    display: none;
  }

  .date-timeline {
    left: 8%;
    top: 12%;
    width: 82%;
    height: 210px;
  }

  .date-timeline__viewport {
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto hidden;
    padding-left: 0;
    overscroll-behavior-x: contain;
    touch-action: pan-x;
  }

  .date-timeline__list {
    grid-auto-flow: column;
    grid-auto-columns: 33.333%;
    width: 100%;
    height: 100%;
  }

  .date-node__connector,
  .date-node__end {
    display: none;
  }

  .date-node {
    width: 100%;
    min-width: 0;
    height: 40px;
  }

  .date-node:nth-of-type(3n + 1) {
    left: 8px;
    top: 0;
  }

  .date-node:nth-of-type(3n + 2) {
    left: 24%;
    top: 36px;
  }

  .date-node:nth-of-type(3n) {
    left: 52%;
    top: 72px;
  }

  .date-node__anchor {
    display: block;
    flex: 0 0 4px;
    width: 4px;
    height: 4px;
    margin-left: 0;
  }

  .date-node--active .date-node__anchor {
    transform: scale(1.25);
  }

  .date-node__label {
    margin-left: 12px;
    font-size: 14px;
  }
}
</style>
