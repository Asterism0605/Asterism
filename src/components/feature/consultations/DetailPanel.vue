<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
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

const { t } = useI18n();

const valueKeys: Record<string, string> = {
  Online: 'consult.online',
  'In-Person': 'consult.inPerson',
  'Graphic Design': 'consult.fieldGraphic',
  graphic: 'consult.fieldGraphic',
  'Interior Design': 'consult.fieldInterior',
  interior: 'consult.fieldInterior',
  Architecture: 'consult.fieldArchitecture',
  architecture: 'consult.fieldArchitecture',
  'Styling Design': 'consult.fieldStyling',
  styling: 'consult.fieldStyling',
  'Visual Concept': 'consult.focusVisual',
  visual: 'consult.focusVisual',
  'Material Palette': 'consult.focusMaterial',
  material: 'consult.focusMaterial',
  'Spatial Mood': 'consult.focusSpatial',
  spatial: 'consult.focusSpatial',
  'Color Direction': 'consult.focusColor',
  color: 'consult.focusColor',
  'Furniture Selection': 'consult.focusFurniture',
  furniture: 'consult.focusFurniture',
  'I would like help defining the visual direction for a new brand identity.':
    'accountConsultations.sampleNotes.brand',
  'I need advice on natural finishes and a calm material palette for my home.':
    'accountConsultations.sampleNotes.homeMaterials',
  'I want to create a warm and quiet atmosphere for a small studio renovation.':
    'accountConsultations.sampleNotes.studio',
  'I would like to refine the color direction for an upcoming editorial shoot.':
    'accountConsultations.sampleNotes.editorial',
  'I need help selecting furniture that works with the scale of my living room.':
    'accountConsultations.sampleNotes.livingRoom'
};

function displayValue(value?: string): string {
  if (!value) return '—';

  return valueKeys[value] ? t(valueKeys[value]) : value;
}

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
      :aria-label="
        showAll
          ? t('accountConsultations.backToSelectedAria')
          : t('accountConsultations.viewAllAria')
      "
      :aria-expanded="showAll"
      @click="emit('toggleView')"
    >
      {{ showAll ? t('accountConsultations.back') : t('accountConsultations.viewAll') }}
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
          <dt>{{ t('consult.method') }}</dt>
          <dd>{{ displayValue(reservation.method) }}</dd>
        </div>
        <div>
          <dt>{{ t('consult.designField') }}</dt>
          <dd>{{ displayValue(reservation.designField) }}</dd>
        </div>
        <div>
          <dt>{{ t('consult.designFocus') }}</dt>
          <dd>{{ displayValue(reservation.designFocus) }}</dd>
        </div>
        <div>
          <dt>{{ t('consult.notes') }}</dt>
          <dd class="consultation-details__notes">{{ displayValue(reservation.notes) }}</dd>
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
  z-index: 10;
  isolation: isolate;
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
  margin: 30px 0 0;
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

.consultation-details__notes {
  max-height: calc(1.42em * 3);
  overflow-y: auto;
  overscroll-behavior: contain;
  box-sizing: border-box;
  width: calc(100% + 40px);
  margin-right: -40px;
  padding-right: 8px;
  white-space: pre-wrap;
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
