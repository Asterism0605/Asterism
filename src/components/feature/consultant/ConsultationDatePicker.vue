<script setup lang="ts">
import { Calendar, ChevronLeft, ChevronRight } from '@lucide/vue';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ConsultationDayAvailabilityResult } from '@/types/consultation';

const { locale } = useI18n();

const props = defineProps<{
  modelValue: string;
  error?: string;
  availabilityByDate?: Record<string, ConsultationDayAvailabilityResult>;
  availabilityLoadingByDate?: Record<string, boolean>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'visible-month-change': [value: string];
}>();

const isOpen = defineModel<boolean>('open', { default: false });
const datePickerRef = ref<HTMLElement | null>(null);
const visibleMonth = ref(getMonthStart(new Date()));
const weekdayLabels = computed(() =>
  locale.value === 'zh'
    ? ['日', '一', '二', '三', '四', '五', '六']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
);

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateOption(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatMonthOption(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split('-');

  if (!year || !month || !day) {
    return value;
  }

  return `${month} / ${day} / ${year}`;
}

function isSameDate(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

const calendarTitle = computed(() =>
  visibleMonth.value.toLocaleDateString(locale.value === 'zh' ? 'zh-TW' : 'en-US', {
    month: 'long',
    year: 'numeric'
  })
);

const displayValue = computed(() => (props.modelValue ? formatDisplayDate(props.modelValue) : ''));

const calendarDays = computed(() => {
  const monthStart = visibleMonth.value;
  const today = getDayStart(new Date());
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    const value = formatDateOption(date);

    return {
      date,
      value,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === monthStart.getMonth(),
      isPast: getDayStart(date) < today,
      isFullyBooked:
        props.availabilityByDate?.[value]?.slots.every((slot) => !slot.available) ?? false,
      isAvailabilityLoading: props.availabilityLoadingByDate?.[value] ?? false,
      isToday: isSameDate(date, today)
    };
  });
});

const isPreviousMonthDisabled = computed(() => {
  const currentMonth = getMonthStart(new Date());

  return visibleMonth.value <= currentMonth;
});

function toggleDatePicker() {
  isOpen.value = !isOpen.value;
}

function moveVisibleMonth(direction: -1 | 1) {
  const nextMonth = new Date(visibleMonth.value);
  nextMonth.setMonth(nextMonth.getMonth() + direction);
  visibleMonth.value = getMonthStart(nextMonth);
}

function selectDate(value: string) {
  const day = calendarDays.value.find((calendarDay) => calendarDay.value === value);

  if (day?.isPast || day?.isFullyBooked) {
    return;
  }

  emit('update:modelValue', value);
  isOpen.value = false;
}

function closeDatePicker() {
  isOpen.value = false;
}

function resetMonth() {
  visibleMonth.value = getMonthStart(new Date());
  isOpen.value = false;
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!datePickerRef.value?.contains(event.target as Node)) {
    closeDatePicker();
  }
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeDatePicker();
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown);
  document.addEventListener('keydown', handleDocumentKeydown);
});

watch(
  () => formatMonthOption(visibleMonth.value),
  (month) => emit('visible-month-change', month),
  { immediate: true }
);

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown);
  document.removeEventListener('keydown', handleDocumentKeydown);
});

defineExpose({ resetMonth });
</script>

<template>
  <div class="recommendation-panel__field">
    <span>{{ $t('consult.dateLabel') }}</span>
    <div ref="datePickerRef" class="recommendation-panel__date-picker">
      <button
        type="button"
        class="recommendation-panel__date-trigger"
        :class="{ 'recommendation-panel__date-trigger--placeholder': !modelValue }"
        :aria-expanded="isOpen"
        aria-haspopup="dialog"
        @click="toggleDatePicker"
      >
        <span>{{ displayValue || $t('consult.selectDate') }}</span>
        <Calendar :size="18" aria-hidden="true" />
      </button>

      <div
        v-if="isOpen"
        class="recommendation-panel__calendar"
        role="dialog"
        :aria-label="$t('consult.chooseDateAria')"
      >
        <div class="recommendation-panel__calendar-header">
          <button
            type="button"
            class="recommendation-panel__calendar-nav"
            :aria-label="$t('consult.prevMonth')"
            :disabled="isPreviousMonthDisabled"
            @click="moveVisibleMonth(-1)"
          >
            <ChevronLeft :size="17" aria-hidden="true" />
          </button>
          <p>{{ calendarTitle }}</p>
          <button
            type="button"
            class="recommendation-panel__calendar-nav"
            :aria-label="$t('consult.nextMonth')"
            @click="moveVisibleMonth(1)"
          >
            <ChevronRight :size="17" aria-hidden="true" />
          </button>
        </div>

        <div class="recommendation-panel__calendar-weekdays" aria-hidden="true">
          <span v-for="weekday in weekdayLabels" :key="weekday">{{ weekday }}</span>
        </div>

        <div class="recommendation-panel__calendar-grid">
          <button
            v-for="day in calendarDays"
            :key="day.value"
            type="button"
            class="recommendation-panel__calendar-day"
            :class="{
              'recommendation-panel__calendar-day--muted': !day.isCurrentMonth,
              'recommendation-panel__calendar-day--today': day.isToday,
              'recommendation-panel__calendar-day--selected': modelValue === day.value
            }"
            :disabled="day.isPast || day.isFullyBooked"
            @click="selectDate(day.value)"
          >
            {{ day.day }}
          </button>
        </div>
      </div>
    </div>
    <small v-if="error">{{ error }}</small>
  </div>
</template>

<style scoped>
.recommendation-panel__field {
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 0;
}

.recommendation-panel__field > span {
  color: #f0ede6d6;
  font-size: 0.9rem;
  font-weight: 600;
}

.recommendation-panel__date-picker {
  position: relative;
}

.recommendation-panel__date-trigger {
  width: 100%;
  min-height: 47px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 0 20px;
  border-radius: 8px;
  background-color: #ffffff12;
  color: var(--color-text-primary);
  font-size: var(--text-caption);
  font-weight: 500;
  text-align: left;
  outline: none;
  transition:
    background-color 200ms ease,
    color 200ms ease;
}

.recommendation-panel__date-trigger:hover,
.recommendation-panel__date-trigger:focus {
  background-color: #ffffff1c;
}

.recommendation-panel__date-trigger--placeholder {
  color: var(--color-text-secondary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.recommendation-panel__calendar {
  position: absolute;
  z-index: 5;
  top: calc(100% + 10px);
  left: 0;
  width: min(100%, 360px);
  container-type: inline-size;
  padding: 16px;
  border: 1px solid #ffffff29;
  border-radius: 8px;
  background: #2b2b2f;
  box-shadow: 0 18px 44px #00000057;
  backdrop-filter: blur(18px);
}

.recommendation-panel__calendar-header {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 34px;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.recommendation-panel__calendar-header p {
  color: var(--color-text-primary);
  font-size: 0.88rem;
  font-weight: 700;
  min-width: 0;
  overflow: hidden;
  text-align: center;
  text-overflow: clip;
  white-space: nowrap;
}

.recommendation-panel__calendar-nav {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--color-text-secondary);
  transition:
    background-color 200ms ease,
    color 200ms ease;
}

.recommendation-panel__calendar-nav:hover:not(:disabled),
.recommendation-panel__calendar-nav:focus:not(:disabled) {
  background-color: #ffffff1a;
  color: var(--color-text-primary);
}

.recommendation-panel__calendar-nav:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.recommendation-panel__calendar-weekdays,
.recommendation-panel__calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.recommendation-panel__calendar-weekdays {
  margin-bottom: 8px;
}

.recommendation-panel__calendar-weekdays span {
  color: #f0ede680;
  font-family: var(--font-family-mono);
  font-size: 0.66rem;
  text-align: center;
  text-transform: uppercase;
}

.recommendation-panel__calendar-day {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #f0ede6c7;
  font-size: 0.82rem;
  font-weight: 600;
  transition:
    background-color 180ms ease,
    color 180ms ease,
    box-shadow 180ms ease;
}

.recommendation-panel__calendar-day:hover:not(:disabled),
.recommendation-panel__calendar-day:focus:not(:disabled) {
  background-color: #ffffff1f;
  color: var(--color-text-primary);
}

.recommendation-panel__calendar-day:disabled {
  cursor: not-allowed;
  opacity: 0.26;
}

.recommendation-panel__calendar-day--muted:not(.recommendation-panel__calendar-day--selected) {
  color: #f0ede661;
}

.recommendation-panel__calendar-day--today:not(.recommendation-panel__calendar-day--selected) {
  box-shadow: inset 0 0 0 1px #ffffff42;
}

.recommendation-panel__calendar-day--selected {
  background: var(--color-gold-dim);
  color: var(--color-void);
}

@container (max-width: 320px) {
  .recommendation-panel__calendar-header p {
    font-size: calc(0.88rem - 1px);
  }
}

.recommendation-panel__field small {
  color: var(--color-stellar-red);
  font-family: var(--font-family-mono);
  font-size: 0.7rem;
}
</style>
