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
      <path class="timeline-orbit__mobile" d="M 1920 720 C 1780 870 1640 1010 1500 1080" />
    </svg>

    <i class="orbit--one" aria-hidden="true"></i>
    <i class="orbit--two" aria-hidden="true"></i>
    <i class="star--one" aria-hidden="true"></i>
    <i class="star--two" aria-hidden="true"></i>
    <i class="star--three" aria-hidden="true"></i>
    <i class="star--four" aria-hidden="true"></i>
    <i class="star--five" aria-hidden="true"></i>

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
  background: #0d0d0f;
  color: rgb(240 237 230 / 92%);
  font-family: var(--font-family-title);
}

/* ---------- 桌機：標題提示 ---------- */
.page-heading {
  position: absolute;
  left: 12%;
  top: 15%;
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
}

.page-heading p {
  margin: 0 0 0 20px;
  color: rgb(240 237 230 / 82%);
  font-size: 23px;
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

.timeline-orbit__mobile {
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
}

.date-node:nth-of-type(1) {
  top: 30%;
}

.date-node:nth-of-type(2) {
  top: 40%;
}

.date-node:nth-of-type(3) {
  top: 50%;
}

.date-node__anchor {
  width: 10px;
  height: 10px;
  margin-left: -5px;
  border-radius: 50%;
  background: rgb(240 237 230 / 92%);
  transition: transform 180ms ease;
}

.date-node__connector {
  width: 88px;
  height: 1px;
  background: rgb(240 237 230 / 76%);
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

.date-node:is(:hover, :focus-visible),
.date-node--active {
  color: rgb(240 237 230 / 92%);
}

.date-node--active .date-node__anchor {
  transform: scale(1.18);
}

/* ---------- 桌機：預約面板 ---------- */
.details-panel {
  position: absolute;
  right: 10%;
  top: calc(50% + 32px);
  z-index: 5;
  width: 440px;
  height: 500px;
  padding: 30px 46px 36px;
  border-radius: 58px;
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
  right: 8px;
  top: calc(50% + 32px);
  display: block;
  width: 720px;
  height: 490px;
  border: 1px solid rgb(240 237 230 / 72%);
  border-radius: 50%;
  transform: translateY(-48%) rotate(-33deg);
}

.orbit--two {
  position: absolute;
  right: 14px;
  top: calc(50% + 32px);
  display: block;
  width: 720px;
  height: 435px;
  border: 1px solid rgb(240 237 230 / 48%);
  border-radius: 50%;
  transform: translateY(-50%) rotate(-8deg);
}

.star--one {
  position: absolute;
  left: 44%;
  top: 29%;
  display: block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgb(240 237 230 / 92%);
  pointer-events: none;
}

.star--two {
  position: absolute;
  left: 38%;
  top: 39%;
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgb(240 237 230 / 92%);
  pointer-events: none;
}
.star--three {
  position: absolute;
  right: 9%;
  top: 14%;
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgb(240 237 230 / 92%);
  pointer-events: none;
}
.star--four {
  position: absolute;
  left: 34%;
  bottom: 24%;
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgb(240 237 230 / 92%);
  pointer-events: none;
}
.star--five {
  position: absolute;
  right: 12%;
  bottom: 27%;
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgb(240 237 230 / 92%);
  pointer-events: none;
}

/* ---------- 手機 ---------- */
@media (max-width: 900px) {
  .timeline-orbit__desktop {
    display: none;
  }

  .timeline-orbit__desktop-arc-one,
  .timeline-orbit__desktop-arc-two {
    display: none;
  }

  .timeline-orbit__mobile {
    display: block;
    fill: none;
    stroke: rgb(240 237 230 / 70%);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .page-heading {
    display: none;
  }

  .date-timeline {
    left: 8%;
    top: 100px;
    width: 84%;
    height: 190px;
  }

  .date-node__connector,
  .date-node__end {
    display: none;
  }

  .date-node {
    width: 300px;
    height: 28px;
  }

  .date-node:nth-of-type(1) {
    left: 0;
    top: 0;
  }

  .date-node:nth-of-type(2) {
    left: 20%;
    top: 58px;
  }

  .date-node:nth-of-type(3) {
    left: 43%;
    top: 116px;
  }

  .date-node__anchor {
    width: 10px;
    height: 10px;
    margin-left: 0;
  }

  .date-node__label {
    margin-left: 20px;
    font-size: 15px;
  }

  .details-panel {
    left: 7%;
    right: auto;
    top: auto;
    bottom: 24px;
    width: 86%;
    height: 385px;
    padding: 24px 38px 28px;
    border-radius: 52px;
    transform: none;
  }

  .details-panel__date {
    margin-top: 20px;
  }

  .details-panel__date time {
    font-size: 30px;
  }

  .details-panel__date span {
    font-size: 17px;
  }

  .consultation-details {
    gap: 10px;
    margin-top: 24px;
  }

  .consultation-details dt,
  .consultation-details dd {
    font-size: 13px;
  }

  .orbit--one {
    left: -260px;
    right: auto;
    top: 46%;
    width: 720px;
    height: 400px;
    transform: translateY(-50%) rotate(24deg);
  }

  .orbit--two {
    left: -230px;
    right: auto;
    top: 47%;
    width: 660px;
    height: 340px;
    transform: translateY(-50%) rotate(17deg);
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
  .date-timeline {
    top: 88px;
  }

  .details-panel {
    left: 16px;
    width: calc(100% - 32px);
    height: 370px;
    padding: 20px 30px 24px;
    border-radius: 46px;
  }
}
</style>
