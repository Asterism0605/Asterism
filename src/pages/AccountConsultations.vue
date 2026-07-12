<script setup lang="ts">
import { computed, ref } from 'vue';

type Reservation = {
  id: string;
  status: 'confirmed';
  consultationDate: string;
  timeSlot: 'am' | 'pm';
  method: string;
  designField: string;
  designFocus: string;
  notes: string;
};

const reservations = (
  [
    {
      id: 'reservation-01',
      status: 'confirmed',
      consultationDate: '2026-07-28',
      timeSlot: 'am',
      method: 'Online',
      designField: 'Graphic Design',
      designFocus: 'Visual Concept',
      notes: 'I would like help defining the visual direction for a new brand identity.'
    },
    {
      id: 'reservation-02',
      status: 'confirmed',
      consultationDate: '2026-08-10',
      timeSlot: 'pm',
      method: 'In-Person',
      designField: 'Interior Design',
      designFocus: 'Material Palette',
      notes: 'I need advice on natural finishes and a calm material palette for my home.'
    },
    {
      id: 'reservation-03',
      status: 'confirmed',
      consultationDate: '2026-10-01',
      timeSlot: 'am',
      method: 'Online',
      designField: 'Architecture',
      designFocus: 'Spatial Mood',
      notes: 'I want to create a warm and quiet atmosphere for a small studio renovation.'
    },
    {
      id: 'reservation-04',
      status: 'confirmed',
      consultationDate: '2026-11-16',
      timeSlot: 'pm',
      method: 'Online',
      designField: 'Styling Design',
      designFocus: 'Color Direction',
      notes: 'I would like to refine the color direction for an upcoming editorial shoot.'
    },
    {
      id: 'reservation-05',
      status: 'confirmed',
      consultationDate: '2027-01-08',
      timeSlot: 'am',
      method: 'In-Person',
      designField: 'Interior Design',
      designFocus: 'Furniture Selection',
      notes: 'I need help selecting furniture that works with the scale of my living room.'
    }
  ] satisfies Reservation[]
).sort((a, b) => a.consultationDate.localeCompare(b.consultationDate));

const selectedId = ref(reservations[0].id);
const visibleReservations = computed(() => reservations.slice(0, 3));
const selectedReservation = computed(
  () => reservations.find((reservation) => reservation.id === selectedId.value) ?? reservations[0]
);

function displayDate(date: string): string {
  return date.replaceAll('-', ' ');
}
</script>

<template>
  <main class="consultations-page">
    <svg
      class="timeline-orbit"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path class="timeline-orbit__desktop" d="M 230 0 L 230 835" />
      <path
        class="timeline-orbit__desktop-arc-one"
        d="M 0 728 C 100 755 175 790 230 835 C 330 915 400 1010 435 1080"
      />
      <path class="timeline-orbit__desktop-arc-two" d="M 0 835 C 150 838 300 900 470 1080" />
    </svg>

    <svg class="mobile-orbits" viewBox="0 0 435 947" preserveAspectRatio="none" aria-hidden="true">
      <circle class="mobile-orbits__one" cx="77" cy="723" r="387" />
      <circle class="mobile-orbits__two" cx="165" cy="707" r="333" />
    </svg>

    <i class="orbit--one" aria-hidden="true"></i>
    <i class="orbit--two" aria-hidden="true"></i>
    <i class="star star--one" aria-hidden="true"></i>
    <i class="star star--two" aria-hidden="true"></i>
    <i class="star star--three" aria-hidden="true"></i>
    <i class="star star--four" aria-hidden="true"></i>
    <i class="star star--five" aria-hidden="true"></i>

    <header class="page-heading">
      <span class="page-heading__line" aria-hidden="true"></span>
      <p>You have {{ reservations.length }} upcoming consultations</p>
    </header>

    <nav class="date-timeline" aria-label="Upcoming consultation dates">
      <button
        v-for="reservation in visibleReservations"
        :key="reservation.id"
        type="button"
        class="date-node"
        :class="{ 'date-node--active': reservation.id === selectedId }"
        :aria-current="reservation.id === selectedId ? 'date' : undefined"
        @click="selectedId = reservation.id"
      >
        <span class="date-node__anchor" aria-hidden="true"></span>
        <span class="date-node__connector" aria-hidden="true"></span>
        <span class="date-node__end" aria-hidden="true"></span>
        <span class="date-node__label">
          {{ displayDate(reservation.consultationDate) }} {{ reservation.timeSlot.toUpperCase() }}
        </span>
      </button>
    </nav>

    <article class="details-panel glass-panel" aria-live="polite">
      <button class="view-all" type="button" aria-label="View all consultations">
        View all <span aria-hidden="true">↗</span>
      </button>

      <div class="details-panel__date">
        <time :datetime="selectedReservation.consultationDate">
          {{ displayDate(selectedReservation.consultationDate) }}
        </time>
        <span>{{ selectedReservation.timeSlot.toUpperCase() }}</span>
      </div>

      <dl class="consultation-details">
        <div>
          <dt>Consultation Method</dt>
          <dd>{{ selectedReservation.method }}</dd>
        </div>
        <div>
          <dt>Design Field</dt>
          <dd>{{ selectedReservation.designField }}</dd>
        </div>
        <div>
          <dt>Design Focus</dt>
          <dd>{{ selectedReservation.designFocus }}</dd>
        </div>
        <div>
          <dt>Notes</dt>
          <dd>{{ selectedReservation.notes }}</dd>
        </div>
      </dl>
    </article>
  </main>
</template>

<style scoped>
.consultations-page {
  position: relative;
  width: 100%;
  height: 100svh;
  overflow: hidden;
  background: var(--color-void);
  color: var(--color-text-primary);
  font-family: var(--font-family-title);
}

/* ---------- 桌機：標題提示 ---------- */
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
  background: rgb(240 237 230 / 75%);
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

.timeline-orbit {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.timeline-orbit__desktop {
  fill: none;
  stroke: rgb(240 237 230 / 70%);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.timeline-orbit__desktop-arc-one {
  fill: none;
  stroke: rgb(240 237 230 / 72%);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.timeline-orbit__desktop-arc-two {
  fill: none;
  stroke: rgb(240 237 230 / 46%);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.mobile-orbits {
  display: none;
}

.date-timeline {
  position: absolute;
  left: 12%;
  top: 0;
  z-index: 4;
  width: 430px;
  height: 100%;
}

.date-node {
  position: absolute;
  left: 0;
  display: flex;
  align-items: center;
  width: 420px;
  height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgb(240 237 230 / 74%);
  font: inherit;
  cursor: pointer;
  opacity: 0.5;
  transition:
    color 180ms ease,
    opacity 180ms ease;
}

.date-node:nth-of-type(1) {
  top: 35%;
}

.date-node:nth-of-type(2) {
  top: 45%;
}

.date-node:nth-of-type(3) {
  top: 55%;
}

.date-node__anchor {
  width: 10px;
  height: 10px;
  margin-left: -5px;
  border-radius: 50%;
  background: rgb(240 237 230 / 92%);
  transition:
    box-shadow 180ms ease,
    transform 180ms ease;
}

.date-node__connector {
  width: 88px;
  height: 1px;
  background: rgb(240 237 230 / 76%);
  transition:
    background-color 180ms ease,
    width 220ms ease;
}

.date-node__end {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgb(240 237 230 / 92%);
}

.date-node__label {
  margin-left: 12px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.025em;
  white-space: nowrap;
}

.date-node:not(.date-node--active):is(:hover, :focus-visible) {
  color: rgb(240 237 230 / 84%);
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
    0 0 0 1px rgb(240 237 230 / 55%),
    0 0 10px rgb(240 237 230 / 18%);
  transform: scale(1.15);
}

.date-node--active .date-node__connector {
  background: rgb(240 237 230 / 90%);
}

/* ---------- 桌機：預約面板 ---------- */
.details-panel {
  position: absolute;
  right: 15%;
  top: calc(50% + 32px);
  z-index: 5;
  width: 440px;
  height: 500px;
  padding: 30px 46px 36px;
  border-radius: 36px;
  background-color: rgb(22 22 25 / 38%);
  transform: translateY(-50%);
}

.view-all {
  display: block;
  margin-left: auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgb(240 237 230 / 82%);
  font: inherit;
  font-size: 14px;
  font-weight: 300;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  cursor: pointer;
}

.view-all span {
  margin-left: 4px;
}

.details-panel__date {
  display: grid;
  justify-items: end;
  margin-top: 38px;
  color: rgb(240 237 230 / 72%);
  font-weight: 200;
}

.details-panel__date time {
  font-size: 38px;
  letter-spacing: 0.025em;
}

.details-panel__date span {
  margin-top: 3px;
  font-size: 20px;
}

.consultation-details {
  display: grid;
  gap: 17px;
  margin: 40px 0 0;
}

.consultation-details div {
  min-width: 0;
}

.consultation-details dt,
.consultation-details dd {
  margin: 0;
  font-size: 15px;
  line-height: 1.42;
}

.consultation-details dt {
  color: rgb(240 237 230 / 90%);
  font-weight: 400;
}

.consultation-details dd {
  color: rgb(240 237 230 / 66%);
  font-weight: 300;
}

.orbit--one {
  position: absolute;
  right: 80px;
  top: calc(50% + 32px);
  display: block;
  width: 720px;
  height: 490px;
  border: 0.8px solid rgb(240 237 230 / 80%);
  border-radius: 50%;
  transform: translateY(-48%) rotate(-33deg);
}

.orbit--two {
  position: absolute;
  right: 77px;
  top: calc(50% + 32px);
  display: block;
  width: 720px;
  height: 435px;
  border: 1px solid rgb(240 237 230 / 24%);
  border-radius: 50%;
  transform: translateY(-50%) rotate(-8deg);
}

.star {
  position: absolute;
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgb(240 237 230 / 92%);
}

.star--one {
  left: 50%;
  top: 29%;
  width: 6px;
  height: 6px;
}

.star--two {
  left: 38%;
  top: 39%;
}
.star--three {
  right: 9%;
  top: 18%;
  width: 8px;
  height: 8px;
}
.star--four {
  left: 25%;
  bottom: 10%;
  width: 6px;
  height: 6px;
}
.star--five {
  right: 8%;
  bottom: 20%;
}

/* ---------- 手機 ---------- */
@media (max-width: 768px) {
  .page-heading,
  .timeline-orbit,
  .timeline-orbit__desktop,
  .timeline-orbit__desktop-arc-one,
  .timeline-orbit__desktop-arc-two {
    display: none;
  }

  .mobile-orbits {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
    transform: translateY(-55px);
    pointer-events: none;
  }

  .mobile-orbits__one {
    fill: none;
    stroke: rgb(240 237 230 / 80%);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .mobile-orbits__two {
    fill: none;
    stroke: rgb(240 237 230 / 26%);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .date-timeline {
    left: 12.5%;
    top: 12.5%;
    width: 80%;
    height: 210px;
  }

  .date-node__connector,
  .date-node__end {
    display: none;
  }

  .date-node {
    width: 310px;
    height: 40px;
  }

  .date-node:nth-of-type(1) {
    left: 0;
    top: 0;
  }

  .date-node:nth-of-type(2) {
    left: 24%;
    top: 36px;
  }

  .date-node:nth-of-type(3) {
    left: 52%;
    top: 72px;
  }

  .date-node__anchor {
    width: 6px;
    height: 6px;
    margin-left: 0;
  }

  .date-node__label {
    margin-left: 12px;
    font-size: 14px;
  }

  .details-panel {
    left: 8%;
    right: auto;
    top: 32%;
    bottom: auto;
    width: 82%;
    height: auto;
    min-height: 0;
    padding: 32px 9vw 38px;
    transform: none;
  }

  .orbit--one, .orbit--two {
    display: none;
  }

  .star--one {
    left: 95%;
    top: 40%;
  }
  .star--two {
    left: 20%;
    top: 97%;
  }
  .star--three {
    display: none;
  }
  .star--four {
    left: 7%;
    bottom: 5%;
  }
  .star--five {
    display: none;
  }
}

@media (max-width: 420px) {
  .date-timeline {
    top: 12%;
  }
}

@media (max-width: 768px) and (max-height: 720px) {
  .date-timeline {
    top: 84px;
  }

  .date-node:nth-of-type(2) {
    top: 48px;
  }

  .date-node:nth-of-type(3) {
    top: 96px;
  }

  .details-panel {
    top: 36.5%;
    bottom: auto;
    padding-right: 30px;
    padding-left: 30px;
    padding-top: 20px;
    padding-bottom: 22px;
  }

  .details-panel__date {
    margin-top: 10px;
  }

  .consultation-details {
    gap: 8px;
    margin-top: 14px;
  }

  .consultation-details div:last-child {
    margin-top: 3px;
  }
}
</style>
