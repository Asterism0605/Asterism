<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import ScrambleText from '@/components/effects/ScrambleText.vue';
import type { AccountConsultation } from '@/types/account-consultation';

defineProps<{
  reservations: AccountConsultation[];
}>();

const { t } = useI18n();

const valueKeys: Record<string, string> = {
  Online: 'consult.online',
  'In-Person': 'consult.inPerson',
  'Graphic Design': 'consult.fieldGraphic',
  'Interior Design': 'consult.fieldInterior',
  Architecture: 'consult.fieldArchitecture',
  'Styling Design': 'consult.fieldStyling',
  'Visual Concept': 'consult.focusVisual',
  'Material Palette': 'consult.focusMaterial',
  'Spatial Mood': 'consult.focusSpatial',
  'Color Direction': 'consult.focusColor',
  'Furniture Selection': 'consult.focusFurniture'
};

function displayValue(value: string): string {
  return valueKeys[value] ? t(valueKeys[value]) : value;
}

function displayDate(date: string): string {
  return date.replaceAll('-', ' ');
}
</script>

<template>
  <section class="all-consultations" :aria-label="t('accountConsultations.allConsultations')">
    <p class="all-consultations__count">
      <span>{{ t('accountConsultations.youHave') }}</span>
      <ScrambleText
        class="consultation-count"
        :text="reservations.length"
        chars="0123456789"
        :duration="1.8"
        :delay="0.2"
      />
      <span class="consultation-upcoming" :data-mobile-label="t('accountConsultations.new')">{{
        t('accountConsultations.upcoming')
      }}</span>
      <ScrambleText
        class="consultation-label"
        :text="t('accountConsultations.consultations')"
        chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
        :duration="1.8"
        :delay="0.2"
      />
    </p>

    <article
      v-for="reservation in reservations"
      :key="reservation.id"
      class="all-consultations__item"
    >
      <header class="all-consultations__header">
        <time :datetime="reservation.consultationDate">
          {{ displayDate(reservation.consultationDate) }}
        </time>
        <span>{{ reservation.timeSlot.toUpperCase() }}</span>
      </header>
      <dl class="all-consultations__meta">
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
      </dl>
    </article>
  </section>
</template>

<style scoped>
.all-consultations {
  max-height: 400px;
  margin-top: 22px;
  overflow: hidden auto;
  padding-right: 8px;
  overscroll-behavior: contain;
  scrollbar-width: none;
}

.all-consultations::-webkit-scrollbar {
  display: none;
}

.all-consultations__count {
  display: none;
}

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

.all-consultations__item {
  padding: 18px 0;
  border-bottom: 1px solid #f0ede624;
}

.all-consultations__item:first-of-type {
  padding-top: 4px;
}

.all-consultations__item:last-child {
  padding-bottom: 4px;
  border-bottom: 0;
}

.all-consultations__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  color: #f0ede6db;
}

.all-consultations__header time {
  font-size: 18px;
  font-weight: 300;
  letter-spacing: 0.04em;
}

.all-consultations__header span {
  color: #f0ede694;
  font-size: 12px;
  letter-spacing: 0.1em;
}

.all-consultations__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 20px;
  margin: 14px 0 0;
}

.all-consultations__meta div:last-child {
  grid-column: 1 / -1;
}

.all-consultations__meta dt,
.all-consultations__meta dd {
  margin: 0;
  line-height: 1.4;
}

.all-consultations__meta dt {
  color: #f0ede66b;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.all-consultations__meta dd {
  margin-top: 3px;
  color: #f0ede6b8;
  font-size: 13px;
  font-weight: 300;
}

@media (max-width: 768px) {
  .consultation-upcoming {
    font-size: 0;
  }

  .consultation-upcoming::after {
    font-size: 14px;
    content: attr(data-mobile-label);
  }

  .all-consultations__count {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.3em;
    margin: 0 0 18px;
    padding: 10px 0;
    color: #ffffff;
    font-size: 14px;
    font-weight: 300;
    letter-spacing: 0.035em;
  }

  .all-consultations__count .consultation-count {
    margin-right: -0.18em;
  }
}
</style>
