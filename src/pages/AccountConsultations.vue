<script setup lang="ts">
import { computed, ref } from 'vue';

type Reservation = {
  id: string;
  status: 'confirmed';
  consultationDate: string;
  timeSlot: 'am' | 'pm';
  method: string;
  designDomain: string;
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
      designDomain: 'Graphic Design',
      designFocus: 'Visual Concept',
      notes: 'Develop a clear visual direction for the new brand identity.'
    },
    {
      id: 'reservation-02',
      status: 'confirmed',
      consultationDate: '2026-08-10',
      timeSlot: 'pm',
      method: 'In person',
      designDomain: 'Interior Design',
      designFocus: 'Material Palette',
      notes: 'Review natural finishes and a calm, cohesive material palette.'
    },
    {
      id: 'reservation-03',
      status: 'confirmed',
      consultationDate: '2026-10-01',
      timeSlot: 'am',
      method: 'Online',
      designDomain: 'Product Design',
      designFocus: 'Design Language',
      notes: 'Define the form, proportion, and tactile details of the collection.'
    },
    {
      id: 'reservation-04',
      status: 'confirmed',
      consultationDate: '2026-11-16',
      timeSlot: 'pm',
      method: 'Online',
      designDomain: 'Brand Design',
      designFocus: 'Art Direction',
      notes: 'Align campaign imagery with the brand narrative and audience.'
    },
    {
      id: 'reservation-05',
      status: 'confirmed',
      consultationDate: '2027-01-08',
      timeSlot: 'am',
      method: 'In person',
      designDomain: 'Spatial Design',
      designFocus: 'Guest Experience',
      notes: 'Explore the arrival sequence and key moments within the space.'
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
    <div class="orbit-scene" aria-hidden="true">
      <i class="orbit orbit--hero-one"></i>
      <i class="orbit orbit--hero-two"></i>
      <i class="orbit orbit--corner"></i>
      <i class="star star--one"></i>
      <i class="star star--two"></i>
      <i class="star star--three"></i>
      <i class="star star--four"></i>
      <i class="star star--five"></i>
    </div>

    <div class="consultations-layout">
      <header class="page-heading">
        <h1>My Consultations</h1>
        <p>You have {{ reservations.length }} upcoming consultations</p>
      </header>

      <nav class="date-timeline" aria-label="Upcoming consultation dates">
        <span class="date-timeline__lead" aria-hidden="true"></span>
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
            <dt>Design Domain</dt>
            <dd>{{ selectedReservation.designDomain }}</dd>
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
    </div>
  </main>
</template>

<style scoped>
.consultations-page {
  --ink: rgb(240 237 230 / 92%);
  position: relative;
  height: 100svh;
  overflow: hidden;
  background: #0d0d0f;
  color: var(--ink);
  font-family: var(--font-family-title);
}

.consultations-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(330px, 0.9fr) minmax(380px, 1.1fr);
  grid-template-rows: auto 1fr;
  column-gap: clamp(52px, 8vw, 130px);
  width: min(1320px, calc(100% - 12vw));
  height: 100%;
  margin: 0 auto;
  padding: clamp(92px, 12vh, 128px) 0 clamp(38px, 5vh, 58px);
}

.page-heading {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  margin-left: 14%;
}

.page-heading h1 {
  position: absolute;
  left: 23%;
  bottom: 3.5vh;
  margin: 0;
  font-size: clamp(4.25rem, 7vw, 7.5rem);
  font-weight: 200;
  line-height: 0.95;
  letter-spacing: -0.045em;
  white-space: nowrap;
}

.page-heading p {
  margin: 0 0 0 138px;
  color: rgb(240 237 230 / 82%);
  font-size: clamp(1.05rem, 1.45vw, 1.65rem);
  font-weight: 300;
  letter-spacing: 0.015em;
}

.page-heading::before {
  width: 140px;
  height: 32px;
  content: '';
  border-top: 1px solid rgb(240 237 230 / 75%);
  border-left: 1px solid transparent;
  clip-path: polygon(0 100%, 38% 0, 100% 0, 100% 4%, 39% 4%, 1% 100%);
  background: rgb(240 237 230 / 75%);
}

.date-timeline {
  position: relative;
  display: grid;
  align-content: center;
  gap: clamp(30px, 5vh, 52px);
  min-height: 0;
  padding-left: 1px;
}

.date-timeline::before {
  position: absolute;
  left: 0;
  top: -120px;
  bottom: -42px;
  width: 1px;
  content: '';
  background: rgb(240 237 230 / 70%);
}

.date-node {
  position: relative;
  display: flex;
  align-items: center;
  width: fit-content;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgb(240 237 230 / 74%);
  font: inherit;
  cursor: pointer;
}

.date-node__anchor {
  width: 20px;
  height: 20px;
  margin-left: -10px;
  border-radius: 50%;
  background: var(--ink);
  transition: transform 180ms ease;
}

.date-node__connector {
  width: 88px;
  height: 1px;
  background: rgb(240 237 230 / 76%);
}

.date-node__end {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--ink);
}

.date-node__label {
  margin-left: 24px;
  font-size: clamp(0.95rem, 1.25vw, 1.3rem);
  font-weight: 300;
  letter-spacing: 0.025em;
  white-space: nowrap;
}

.date-node:is(:hover, :focus-visible),
.date-node--active {
  color: var(--ink);
}

.date-node--active .date-node__anchor {
  transform: scale(1.18);
}

.details-panel {
  align-self: center;
  justify-self: center;
  width: min(100%, 440px);
  min-height: min(500px, 64vh);
  margin-bottom: 2vh;
  padding: 30px 46px 36px;
  border-radius: 58px;
  background-color: rgb(22 22 25 / 38%);
}

.view-all {
  display: block;
  margin-left: auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgb(240 237 230 / 82%);
  font: inherit;
  font-size: 0.88rem;
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
  font-size: clamp(1.8rem, 2.35vw, 2.4rem);
  letter-spacing: 0.025em;
}

.details-panel__date span {
  margin-top: 3px;
  font-size: 1.25rem;
}

.consultation-details {
  display: grid;
  gap: clamp(14px, 2.2vh, 22px);
  margin: clamp(36px, 5vh, 54px) 0 0;
}

.consultation-details div {
  min-width: 0;
}

.consultation-details dt,
.consultation-details dd {
  margin: 0;
  font-size: 0.95rem;
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

.orbit-scene {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.orbit {
  position: absolute;
  display: block;
  border: 1px solid rgb(240 237 230 / 72%);
  border-radius: 50%;
}

.orbit--hero-one {
  right: -2vw;
  top: 23%;
  width: 54vw;
  height: 36vw;
  transform: rotate(-29deg);
}

.orbit--hero-two {
  right: 3vw;
  top: 22%;
  width: 49vw;
  height: 31vw;
  opacity: 0.65;
  transform: rotate(-41deg);
}

.orbit--corner {
  left: -18vw;
  bottom: -29vw;
  width: 48vw;
  height: 48vw;
}

.star {
  position: absolute;
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--ink);
}

.star--one {
  left: 44%;
  top: 29%;
  width: 16px;
  height: 16px;
}
.star--two {
  left: 38%;
  top: 39%;
}
.star--three {
  right: 9%;
  top: 14%;
}
.star--four {
  left: 34%;
  bottom: 24%;
}
.star--five {
  right: 12%;
  bottom: 27%;
}

@media (max-width: 900px) {
  .consultations-page {
    height: 100svh;
    overflow: hidden;
  }

  .consultations-layout {
    display: block;
    width: 100%;
    height: 100%;
    padding: clamp(76px, 10vh, 92px) 0 20px;
  }

  .page-heading {
    display: block;
    margin: 0;
    padding: 0 8vw;
  }

  .page-heading::before,
  .page-heading p {
    display: none;
  }

  .page-heading h1 {
    position: static;
    font-size: clamp(2.2rem, 8vw, 3.25rem);
    letter-spacing: -0.025em;
    white-space: normal;
  }

  .date-timeline {
    display: block;
    height: clamp(130px, 19vh, 170px);
    min-height: 0;
    margin: clamp(36px, 6vh, 54px) 8vw 0;
    padding: 0;
  }

  .date-timeline::before,
  .date-node__connector,
  .date-node__end {
    display: none;
  }

  .date-node {
    position: absolute;
    min-height: auto;
  }

  .date-node:nth-child(2) {
    left: 0;
    top: 0;
  }
  .date-node:nth-child(3) {
    left: 20%;
    top: clamp(48px, 7vh, 62px);
  }
  .date-node:nth-child(4) {
    left: 43%;
    top: clamp(96px, 14vh, 124px);
  }

  .date-node__anchor {
    width: 10px;
    height: 10px;
    margin: 0;
  }

  .date-node__label {
    margin-left: 20px;
    font-size: clamp(0.82rem, 3.3vw, 1.1rem);
  }

  .details-panel {
    position: relative;
    width: calc(100% - 14vw);
    height: clamp(390px, 56vh, 510px);
    min-height: 0;
    margin: clamp(20px, 3vh, 30px) auto 0;
    padding: clamp(24px, 4vh, 36px) clamp(30px, 8vw, 60px) 30px;
    border-radius: clamp(44px, 10vw, 64px);
  }

  .details-panel__date {
    margin-top: clamp(24px, 4vh, 38px);
  }

  .details-panel__date time {
    font-size: clamp(1.75rem, 7vw, 2.6rem);
  }

  .consultation-details {
    gap: clamp(12px, 2vh, 20px);
    margin-top: clamp(30px, 5vh, 48px);
  }

  .consultation-details dt,
  .consultation-details dd {
    font-size: clamp(0.84rem, 3.5vw, 1.05rem);
  }

  .orbit--hero-one {
    left: -42%;
    right: auto;
    top: 36%;
    width: 155vw;
    height: 86vw;
    transform: rotate(24deg);
  }

  .orbit--hero-two {
    left: -37%;
    right: auto;
    top: 37%;
    width: 143vw;
    height: 74vw;
    transform: rotate(17deg);
  }

  .orbit--corner {
    left: auto;
    right: -72vw;
    bottom: -36vw;
    width: 106vw;
    height: 106vw;
  }

  .star--one {
    left: 92%;
    top: 43%;
  }
  .star--two {
    left: 28%;
    top: 91%;
  }
  .star--three {
    right: 7%;
    top: 30%;
  }
  .star--four {
    left: 12%;
    bottom: 4%;
    width: 7px;
    height: 7px;
  }
  .star--five {
    right: 24%;
    bottom: 6%;
  }
}

@media (max-width: 420px) {
  .consultations-layout {
    padding-top: 72px;
  }

  .date-timeline {
    margin-top: 34px;
  }

  .details-panel {
    width: calc(100% - 32px);
    margin-top: 18px;
  }
}

@media (max-width: 900px) and (max-height: 720px) {
  .consultations-layout {
    padding-top: 66px;
  }

  .page-heading h1 {
    font-size: 2rem;
  }

  .date-timeline {
    height: 116px;
    margin-top: 22px;
  }

  .details-panel {
    height: 385px;
    margin-top: 12px;
    padding-top: 20px;
  }

  .details-panel__date {
    margin-top: 18px;
  }

  .consultation-details {
    gap: 10px;
    margin-top: 24px;
  }
}
</style>
