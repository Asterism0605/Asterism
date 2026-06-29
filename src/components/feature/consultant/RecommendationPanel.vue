<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import ConsultationDatePicker from '@/components/feature/consultant/ConsultationDatePicker.vue';
import ConsultationDropdown from '@/components/feature/consultant/ConsultationDropdown.vue';
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
  contactPhone: string;
  notes: string;
  paymentConfirmed: boolean;
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
  name: props.accountName,
  email: props.accountEmail,
  contactPhone: '',
  notes: '',
  paymentConfirmed: false
});

const form = reactive<BookingForm>(defaultForm());
const hasSubmitted = ref(false);
const isDatePickerOpen = ref(false);
const isTimeSlotOpen = ref(false);
const isDesignFieldOpen = ref(false);
const isDesignFocusOpen = ref(false);
const datePickerRef = ref<InstanceType<typeof ConsultationDatePicker> | null>(null);

const timeSlotOptions: Array<{ label: string; value: Exclude<TimeSlot, ''> }> = [
  { label: 'AM', value: 'am' },
  { label: 'PM', value: 'pm' }
];

const fieldOptions = ['Styling design', 'Graphic Design', 'Interior Design', 'Architecture'].map(
  (field) => ({ label: field, value: field })
);

const focusOptions = [
  'Spatial mood',
  'Material palette',
  'Color direction',
  'Furniture selection',
  'Visual concept'
].map((focus) => ({ label: focus, value: focus }));

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
    email: form.email.trim().includes('@') ? '' : 'A valid email is required.',
    contactPhone: form.contactPhone.trim() ? '' : 'Contact phone is required.',
    paymentConfirmed: form.paymentConfirmed
      ? ''
      : 'Please confirm the consultation deposit before continuing.'
  };
});

watch(
  () => [props.accountName, props.accountEmail],
  ([accountName, accountEmail]) => {
    form.name = accountName;
    form.email = accountEmail;
  },
  { immediate: true }
);

function closeDropdowns() {
  isTimeSlotOpen.value = false;
  isDesignFieldOpen.value = false;
  isDesignFocusOpen.value = false;
}

function handleDatePickerOpen(value: boolean) {
  isDatePickerOpen.value = value;
  if (value) {
    closeDropdowns();
  }
}

function handleDropdownOpen(field: 'timeSlot' | 'designField' | 'designFocus', value: boolean) {
  isDatePickerOpen.value = false;

  if (field === 'timeSlot') {
    isTimeSlotOpen.value = value;
    isDesignFieldOpen.value = false;
    isDesignFocusOpen.value = false;
  } else if (field === 'designField') {
    isTimeSlotOpen.value = false;
    isDesignFieldOpen.value = value;
    isDesignFocusOpen.value = false;
  } else {
    isTimeSlotOpen.value = false;
    isDesignFieldOpen.value = false;
    isDesignFocusOpen.value = value;
  }
}

function resetForm() {
  Object.assign(form, defaultForm());
  hasSubmitted.value = false;
  isDatePickerOpen.value = false;
  closeDropdowns();
  datePickerRef.value?.resetMonth();
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
      <ConsultationDatePicker
        ref="datePickerRef"
        v-model="form.date"
        :open="isDatePickerOpen"
        :error="fieldErrors.date"
        @update:open="handleDatePickerOpen"
      />

      <ConsultationDropdown
        v-model="form.timeSlot"
        :open="isTimeSlotOpen"
        label="Time Slot"
        placeholder="AM / PM"
        list-label="Choose time slot"
        :options="timeSlotOptions"
        :error="fieldErrors.timeSlot"
        uppercase-value
        @update:open="(value) => handleDropdownOpen('timeSlot', value)"
      />

      <ConsultationDropdown
        v-model="form.designField"
        :open="isDesignFieldOpen"
        label="Design Field"
        placeholder="Select a field"
        list-label="Choose design field"
        :options="fieldOptions"
        :error="fieldErrors.designField"
        @update:open="(value) => handleDropdownOpen('designField', value)"
      />

      <ConsultationDropdown
        v-model="form.designFocus"
        :open="isDesignFocusOpen"
        label="Design Focus"
        placeholder="Select a focus area"
        list-label="Choose design focus"
        :options="focusOptions"
        :error="fieldErrors.designFocus"
        @update:open="(value) => handleDropdownOpen('designFocus', value)"
      />
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

      <label class="recommendation-panel__field recommendation-panel__field--wide">
        <span>Contact Phone</span>
        <FormInput v-model="form.contactPhone" placeholder="+886 912 345 678" autocomplete="tel" />
        <small v-if="fieldErrors.contactPhone">{{ fieldErrors.contactPhone }}</small>
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

    <section class="recommendation-panel__fee" aria-labelledby="consultation-fee-title">
      <div>
        <p id="consultation-fee-title" class="recommendation-panel__label">Consultation Fee</p>
        <p class="recommendation-panel__fee-amount">NT$500 deposit</p>
        <p class="recommendation-panel__fee-copy">
          A consultation deposit is required to submit your request.
        </p>
      </div>

      <label class="recommendation-panel__payment-confirmation">
        <input v-model="form.paymentConfirmed" type="checkbox" />
        <span>I understand and agree to continue to payment.</span>
      </label>
      <small v-if="fieldErrors.paymentConfirmed">{{ fieldErrors.paymentConfirmed }}</small>
      <p class="recommendation-panel__demo-note">
        For demo purposes only. No real payment will be charged.
      </p>
    </section>

    <div class="recommendation-panel__actions">
      <Button type="submit">CONFIRM &amp; PAY</Button>
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

.recommendation-panel__field--wide {
  grid-column: 1 / -1;
}

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

.recommendation-panel__textarea {
  resize: vertical;
  min-height: 132px;
  padding: 14px 20px;
  line-height: 1.6;
}

.recommendation-panel__textarea::placeholder {
  color: var(--color-text-secondary);
}

.recommendation-panel__textarea:focus {
  background-color: rgb(255 255 255 / 0.11);
}

.recommendation-panel__field small {
  color: var(--color-stellar-red);
  font-family: var(--font-family-mono);
  font-size: 0.7rem;
}

.recommendation-panel__fee {
  display: grid;
  gap: 12px;
}

.recommendation-panel__fee-amount {
  margin-top: 8px;
  color: var(--color-text-primary);
  font-family: var(--font-family-mono);
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.recommendation-panel__fee-copy {
  color: rgb(240 237 230 / 0.68);
  font-size: 0.82rem;
  line-height: 1.55;
}

.recommendation-panel__payment-confirmation {
  display: inline-flex;
  align-items: flex-start;
  gap: 10px;
  color: rgb(240 237 230 / 0.82);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
}

.recommendation-panel__payment-confirmation input {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  flex: 0 0 auto;
  accent-color: var(--color-gold-dim);
}

.recommendation-panel__fee small {
  color: var(--color-stellar-red);
  font-family: var(--font-family-mono);
  font-size: 0.7rem;
}

.recommendation-panel__demo-note {
  color: rgb(240 237 230 / 0.68);
  font-size: 12px;
  line-height: 1.55;
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
