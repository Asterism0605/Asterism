<script setup lang="ts">
import { Calendar, ChevronLeft, ChevronRight } from '@lucide/vue';
import { computed, reactive, ref } from 'vue';
import Button from '@/components/ui/Button.vue';
import FormInput from '@/components/ui/FormInput.vue';

type ConsultationMethod = 'online' | 'in-person';
type TimeSlot = '' | 'am' | 'pm';

interface BookingForm {
  method: ConsultationMethod;
  date: string;
  timeSlot: TimeSlot;
  designField: string;
  designFocus: string;
  name: string;
  email: string;
  notes: string;
}

const props = withDefaults(
  defineProps<{
    accountName?: string;
    accountEmail?: string;
  }>(),
  {
    accountName: '',
    accountEmail: ''
  }
);

const emit = defineEmits<{
  submit: [payload: BookingForm];
  reset: [];
}>();

const defaultForm = (): BookingForm => ({
  method: 'online',
  date: '',
  timeSlot: '',
  designField: '',
  designFocus: '',
  name: '',
  email: '',
  notes: ''
});

const form = reactive<BookingForm>(defaultForm());
const hasSubmitted = ref(false);
const useAccountInfo = ref(false);
const isDatePickerOpen = ref(false);
const visibleMonth = ref(getMonthStart(new Date()));

const fieldOptions = [
  'Styling design',
  'Graphic Design',
  'Interior Design',
  'Architecture',
];

const focusOptions = [
  'Spatial mood',
  'Material palette',
  'Color direction',
  'Furniture selection',
  'Visual concept'
];

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateOption(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

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
  visibleMonth.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
);

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
      isSelected: form.date === value,
      isToday: isSameDate(date, today)
    };
  });
});

const isPreviousMonthDisabled = computed(() => {
  const currentMonth = getMonthStart(new Date());

  return visibleMonth.value <= currentMonth;
});

const fieldErrors = computed(() => {
  if (!hasSubmitted.value) {
    return {};
  }

  return {
    date: form.date ? '' : 'Date is required.',
    timeSlot: form.timeSlot ? '' : 'Time slot is required.',
    designField: '',
    designFocus: '',
    name: form.name.trim() ? '' : 'Name is required.',
    email: form.email.trim().includes('@') ? '' : 'A valid email is required.'
  };
});

const hasAccountInfo = computed(() => Boolean(props.accountName || props.accountEmail));

function toggleDatePicker() {
  isDatePickerOpen.value = !isDatePickerOpen.value;
}

function moveVisibleMonth(direction: -1 | 1) {
  const nextMonth = new Date(visibleMonth.value);
  nextMonth.setMonth(nextMonth.getMonth() + direction);
  visibleMonth.value = getMonthStart(nextMonth);
}

function selectDate(value: string) {
  form.date = value;
  isDatePickerOpen.value = false;
}

function applyAccountInfo() {
  useAccountInfo.value = !useAccountInfo.value;

  if (!useAccountInfo.value) {
    return;
  }

  form.name = props.accountName;
  form.email = props.accountEmail;
}

function resetForm() {
  Object.assign(form, defaultForm());
  hasSubmitted.value = false;
  useAccountInfo.value = false;
  isDatePickerOpen.value = false;
  visibleMonth.value = getMonthStart(new Date());
  emit('reset');
}

function handleSubmit() {
  hasSubmitted.value = true;

  if (Object.values(fieldErrors.value).some(Boolean)) {
    return;
  }

  emit('submit', { ...form });
}
</script>

<template>
  <form class="recommendation-panel" novalidate @submit.prevent="handleSubmit">
    <div class="recommendation-panel__section">
      <p class="recommendation-panel__label">Consultation Method</p>
      <div class="recommendation-panel__radio-grid">
        <label class="recommendation-panel__choice">
          <input v-model="form.method" type="radio" value="online" />
          <span>Online</span>
        </label>
        <label class="recommendation-panel__choice">
          <input v-model="form.method" type="radio" value="in-person" />
          <span>In-Person</span>
        </label>
      </div>
    </div>

    <div class="recommendation-panel__grid">
      <div class="recommendation-panel__field">
        <span>Date</span>
        <div class="recommendation-panel__date-picker">
          <button
            type="button"
            class="recommendation-panel__date-trigger"
            :class="{ 'recommendation-panel__date-trigger--placeholder': !form.date }"
            :aria-expanded="isDatePickerOpen"
            aria-haspopup="dialog"
            @click="toggleDatePicker"
          >
            <span>{{ form.date || 'Select a date' }}</span>
            <Calendar :size="18" aria-hidden="true" />
          </button>

          <div
            v-if="isDatePickerOpen"
            class="recommendation-panel__calendar"
            role="dialog"
            aria-label="Choose consultation date"
          >
            <div class="recommendation-panel__calendar-header">
              <button
                type="button"
                class="recommendation-panel__calendar-nav"
                aria-label="Previous month"
                :disabled="isPreviousMonthDisabled"
                @click="moveVisibleMonth(-1)"
              >
                <ChevronLeft :size="17" aria-hidden="true" />
              </button>
              <p>{{ calendarTitle }}</p>
              <button
                type="button"
                class="recommendation-panel__calendar-nav"
                aria-label="Next month"
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
                  'recommendation-panel__calendar-day--selected': day.isSelected
                }"
                :disabled="day.isPast"
                @click="selectDate(day.value)"
              >
                {{ day.day }}
              </button>
            </div>
          </div>
        </div>
        <small v-if="fieldErrors.date">{{ fieldErrors.date }}</small>
      </div>

      <label class="recommendation-panel__field">
        <span>Time Slot</span>
        <select
          v-model="form.timeSlot"
          class="recommendation-panel__select"
          :class="{ 'recommendation-panel__select--placeholder': !form.timeSlot }"
        >
          <option value="">AM / PM</option>
          <option value="am">AM</option>
          <option value="pm">PM</option>
        </select>
        <small v-if="fieldErrors.timeSlot">{{ fieldErrors.timeSlot }}</small>
      </label>

      <label class="recommendation-panel__field">
        <span>Design Field</span>
        <select
          v-model="form.designField"
          class="recommendation-panel__select"
          :class="{ 'recommendation-panel__select--placeholder': !form.designField }"
        >
          <option value="">Select a field</option>
          <option v-for="field in fieldOptions" :key="field" :value="field">
            {{ field }}
          </option>
        </select>
        <small v-if="fieldErrors.designField">{{ fieldErrors.designField }}</small>
      </label>

      <label class="recommendation-panel__field">
        <span>Design Focus</span>
        <select
          v-model="form.designFocus"
          class="recommendation-panel__select"
          :class="{ 'recommendation-panel__select--placeholder': !form.designFocus }"
        >
          <option value="">Select a focus area</option>
          <option v-for="focus in focusOptions" :key="focus" :value="focus">
            {{ focus }}
          </option>
        </select>
        <small v-if="fieldErrors.designFocus">{{ fieldErrors.designFocus }}</small>
      </label>
    </div>

    <div class="recommendation-panel__section">
      <p class="recommendation-panel__label">Contact Information</p>
      <button
        type="button"
        class="recommendation-panel__account"
        :disabled="!hasAccountInfo"
        @click="applyAccountInfo"
      >
        <span aria-hidden="true">{{ useAccountInfo ? '●' : '○' }}</span>
        Use my account info
      </button>
    </div>

    <div class="recommendation-panel__grid">
      <label class="recommendation-panel__field">
        <span>Name</span>
        <FormInput v-model="form.name" placeholder="Your name" />
        <small v-if="fieldErrors.name">{{ fieldErrors.name }}</small>
      </label>

      <label class="recommendation-panel__field">
        <span>Email</span>
        <FormInput v-model="form.email" type="email" placeholder="your@email.com" />
        <small v-if="fieldErrors.email">{{ fieldErrors.email }}</small>
      </label>
    </div>

    <label class="recommendation-panel__field">
      <span>Additional Notes</span>
      <textarea
        v-model="form.notes"
        class="recommendation-panel__textarea"
        placeholder="Tell us about your project or questions."
        rows="5"
      />
    </label>

    <div class="recommendation-panel__actions">
      <Button type="submit">SEND</Button>
      <Button type="button" variant="secondary" @click="resetForm">RESET</Button>
    </div>
  </form>
</template>

<style scoped>
.recommendation-panel {
  --recommendation-panel-menu-bg: #2b2b2f;

  display: grid;
  gap: 32px;
  padding: clamp(24px, 5vw, 46px);
  border: 1px solid rgb(255 255 255 / 0.16);
  border-radius: 8px;
  background:
    radial-gradient(circle at 14% 0%, rgb(255 255 255 / 0.18), transparent 34%),
    rgb(255 255 255 / 0.055);
  box-shadow:
    inset 1px 1px 1px rgb(255 255 255 / 0.16),
    0 24px 80px rgb(0 0 0 / 0.34);
  backdrop-filter: blur(18px);
}

.recommendation-panel__section {
  display: grid;
  gap: 12px;
}

.recommendation-panel__label,
.recommendation-panel__field > span {
  color: rgb(240 237 230 / 0.84);
  font-size: 0.9rem;
  font-weight: 600;
}

.recommendation-panel__radio-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}

.recommendation-panel__choice {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: rgb(240 237 230 / 0.72);
  font-size: 0.9rem;
}

.recommendation-panel__choice input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-gold-dim);
}

.recommendation-panel__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 32px;
}

.recommendation-panel__field {
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 0;
}

.recommendation-panel__select,
.recommendation-panel__textarea {
  width: 100%;
  border-radius: 8px;
  background-color: rgb(255 255 255 / 0.07);
  color: var(--color-text-primary);
  font-size: var(--text-caption);
  font-weight: 500;
  outline: none;
  transition: background-color 200ms ease;
}

.recommendation-panel__select {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.5 6.75L9 11.25L13.5 6.75' stroke='%238A8880' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-position: right 20px center;
  background-repeat: no-repeat;
  background-size: 18px 18px;
  min-height: 47px;
  padding: 0 20px;
  padding-right: 56px;
}

.recommendation-panel__select--placeholder {
  color: var(--color-text-secondary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.recommendation-panel__select option {
  background: var(--recommendation-panel-menu-bg);
  color: var(--color-text-primary);
  letter-spacing: 0;
  text-transform: none;
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
  background-color: rgb(255 255 255 / 0.07);
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
  background-color: rgb(255 255 255 / 0.11);
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
  border: 1px solid rgb(255 255 255 / 0.16);
  border-radius: 8px;
  background: var(--recommendation-panel-menu-bg);
  box-shadow: 0 18px 44px rgb(0 0 0 / 0.34);
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
  background-color: rgb(255 255 255 / 0.1);
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
  color: rgb(240 237 230 / 0.5);
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
  color: rgb(240 237 230 / 0.78);
  font-size: 0.82rem;
  font-weight: 600;
  transition:
    background-color 180ms ease,
    color 180ms ease,
    box-shadow 180ms ease;
}

.recommendation-panel__calendar-day:hover:not(:disabled),
.recommendation-panel__calendar-day:focus:not(:disabled) {
  background-color: rgb(255 255 255 / 0.12);
  color: var(--color-text-primary);
}

.recommendation-panel__calendar-day:disabled {
  cursor: not-allowed;
  opacity: 0.26;
}

.recommendation-panel__calendar-day--muted:not(.recommendation-panel__calendar-day--selected) {
  color: rgb(240 237 230 / 0.38);
}

.recommendation-panel__calendar-day--today:not(.recommendation-panel__calendar-day--selected) {
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.26);
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

.recommendation-panel__textarea {
  resize: vertical;
  min-height: 132px;
  padding: 14px 20px;
  line-height: 1.6;
}

.recommendation-panel__textarea::placeholder {
  color: var(--color-text-secondary);
}

.recommendation-panel__select:focus,
.recommendation-panel__textarea:focus {
  background-color: rgb(255 255 255 / 0.11);
}

.recommendation-panel__account {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text-secondary);
  font-size: 0.88rem;
  cursor: pointer;
  transition: color 200ms ease;
}

.recommendation-panel__account:hover:not(:disabled) {
  color: var(--color-text-primary);
}

.recommendation-panel__account:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.recommendation-panel__field small {
  color: var(--color-stellar-red);
  font-family: var(--font-family-mono);
  font-size: 0.7rem;
}

.recommendation-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  padding-top: 6px;
}

@media (max-width: 720px) {
  .recommendation-panel__grid {
    grid-template-columns: 1fr;
  }
}
</style>
