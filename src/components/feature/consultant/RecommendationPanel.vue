<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import Button from '@/components/ui/Button.vue';
import FormInput from '@/components/ui/FormInput.vue';

type ConsultationMethod = 'online' | 'in-person';
type TimeSlot = '' | 'morning' | 'afternoon' | 'evening';

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

const fieldOptions = [
  'Interior Design',
  'Architecture',
  'Brand Identity',
  'Product Styling',
  'Retail Experience'
];

const focusOptions = [
  'Spatial mood',
  'Material palette',
  'Color direction',
  'Furniture selection',
  'Visual concept'
];

const fieldErrors = computed(() => {
  if (!hasSubmitted.value) {
    return {};
  }

  return {
    date: form.date.trim() ? '' : 'Preferred date is required.',
    timeSlot: form.timeSlot ? '' : 'Preferred time slot is required.',
    designField: form.designField ? '' : 'Design field is required.',
    designFocus: form.designFocus ? '' : 'Design focus is required.',
    name: form.name.trim() ? '' : 'Name is required.',
    email: form.email.trim().includes('@') ? '' : 'A valid email is required.'
  };
});

const hasAccountInfo = computed(() => Boolean(props.accountName || props.accountEmail));

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
      <label class="recommendation-panel__field">
        <span>Preferred Date</span>
        <FormInput v-model="form.date" placeholder="MM / DD / YYYY" />
        <small v-if="fieldErrors.date">{{ fieldErrors.date }}</small>
      </label>

      <label class="recommendation-panel__field">
        <span>Preferred Time Slot</span>
        <select
          v-model="form.timeSlot"
          class="recommendation-panel__select"
          :class="{ 'recommendation-panel__select--placeholder': !form.timeSlot }"
        >
          <option value="">Morning / Afternoon / Evening</option>
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
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
  display: grid;
  gap: 24px;
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
  font-size: 0.88rem;
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
  gap: 18px;
}

.recommendation-panel__field {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.recommendation-panel__select,
.recommendation-panel__textarea {
  width: 100%;
  border-radius: 8px;
  background: rgb(255 255 255 / 0.07);
  color: var(--color-text-primary);
  font-size: var(--text-caption);
  font-weight: 500;
  outline: none;
  transition: background 200ms ease;
}

.recommendation-panel__select {
  min-height: 47px;
  padding: 0 20px;
}

.recommendation-panel__select--placeholder {
  color: var(--color-text-secondary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.recommendation-panel__select option {
  background: var(--color-elevated);
  color: var(--color-text-primary);
  letter-spacing: 0;
  text-transform: none;
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
  background: rgb(255 255 255 / 0.11);
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
