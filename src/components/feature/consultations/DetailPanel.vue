<script setup lang="ts">
import { ref } from 'vue';
import ScrambleText from '@/components/effects/ScrambleText.vue';
import type { AccountConsultation } from '@/types/account-consultation';
import ConsultationList from './ConsultationList.vue';

defineProps<{
  reservation: AccountConsultation;
  reservations: AccountConsultation[];
  showAll: boolean;
}>();

const emit = defineEmits<{
  toggleView: [];
}>();

const dateScramble = ref<InstanceType<typeof ScrambleText> | null>(null);

function displayDate(date: string): string {
  return date.replaceAll('-', ' ');
}

function playDateAnimation(): void {
  dateScramble.value?.play();
}

defineExpose({ playDateAnimation });
</script>

<template>
  <article class="details-panel glass-panel" aria-live="polite">
    <button
      class="view-all"
      type="button"
      :aria-label="showAll ? 'Back to selected consultation' : 'View all consultations'"
      :aria-expanded="showAll"
      @click="emit('toggleView')"
    >
      {{ showAll ? 'Back' : 'View all' }}
      <span aria-hidden="true">{{ showAll ? '↙' : '↗' }}</span>
    </button>

    <template v-if="!showAll">
      <div class="details-panel__date">
        <time :datetime="reservation.consultationDate">
          <ScrambleText
            ref="dateScramble"
            :text="displayDate(reservation.consultationDate)"
            chars="0123456789 "
            :duration="1.2"
            :autoplay="false"
          />
        </time>
        <span>{{ reservation.timeSlot.toUpperCase() }}</span>
      </div>

      <dl class="consultation-details">
        <div>
          <dt>Consultation Method</dt>
          <dd>{{ reservation.method }}</dd>
        </div>
        <div>
          <dt>Design Field</dt>
          <dd>{{ reservation.designField }}</dd>
        </div>
        <div>
          <dt>Design Focus</dt>
          <dd>{{ reservation.designFocus }}</dd>
        </div>
        <div>
          <dt>Notes</dt>
          <dd>{{ reservation.notes }}</dd>
        </div>
      </dl>
    </template>

    <ConsultationList v-else :reservations="reservations" />
  </article>
</template>

<style scoped>
.details-panel {
  position: absolute;
  right: 15%;
  top: calc(50% + 32px);
  z-index: 5;
  width: 440px;
  height: 500px;
  padding: 30px 46px 36px;
  border-radius: 36px;
  background-color: #16161961;
  transform: translateY(-50%);
}

.view-all {
  display: block;
  margin-left: auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f0ede6d1;
  font: inherit;
  font-size: 14px;
  font-weight: 300;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  cursor: pointer;
  transition: filter 180ms ease;
}

.view-all:is(:hover, :focus-visible) {
  filter: drop-shadow(0 0 7px #f0ede657);
}

.view-all span {
  margin-left: 4px;
}

.details-panel__date {
  display: grid;
  justify-items: end;
  margin-top: 38px;
  color: #f0ede6b8;
  font-weight: 200;
}

.details-panel__date time {
  font-size: 38px;
  letter-spacing: 0.025em;
}

.details-panel__date > span {
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
  color: #f0ede6e6;
  font-weight: 400;
}

.consultation-details dd {
  color: #f0ede6a8;
  font-weight: 300;
}

@media (max-width: 768px) {
  .details-panel {
    left: 8%;
    right: auto;
    top: 32%;
    width: 82%;
    height: auto;
    min-height: 0;
    padding: 32px 9vw 38px;
    transform: none;
  }
}
</style>
