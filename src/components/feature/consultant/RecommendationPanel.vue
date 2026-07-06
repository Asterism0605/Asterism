<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ConsultationDatePicker from '@/components/feature/consultant/ConsultationDatePicker.vue';
import ConsultationDropdown from '@/components/feature/consultant/ConsultationDropdown.vue';
import Button from '@/components/ui/Button.vue';
import FormInput from '@/components/ui/FormInput.vue';

type ConsultationMethod = 'online' | 'in_person';
type TimeSlot = '' | 'am' | 'pm';
type SubmittedTimeSlot = Exclude<TimeSlot, ''>;

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

interface BookingPayload extends Omit<BookingForm, 'timeSlot'> {
  timeSlot: SubmittedTimeSlot;
}

const props = withDefaults(
  defineProps<{
    accountName?: string;
    accountEmail?: string;
    submitting?: boolean;
  }>(),
  {
    accountName: '',
    accountEmail: '',
    submitting: false
  }
);

const emit = defineEmits<{
  submit: [payload: BookingPayload];
  reset: [];
}>();

const { t } = useI18n();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[\d\s\-+()]{7,20}$/;

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
const hasEditedName = ref(false);
const hasEditedEmail = ref(false);
const isDatePickerOpen = ref(false);
const isTimeSlotOpen = ref(false);
const isDesignFieldOpen = ref(false);
const isDesignFocusOpen = ref(false);
const datePickerRef = ref<InstanceType<typeof ConsultationDatePicker> | null>(null);

const timeSlotOptions: Array<{ label: string; value: Exclude<TimeSlot, ''> }> = [
  { label: 'AM', value: 'am' },
  { label: 'PM', value: 'pm' }
];

// ponytail: label===value（皆隨語言變）。預約是 mock、沒接後端，語言化的值不影響任何送出。
// 若日後接真後端要固定英文值，改成 value 存英文、label 顯譯文，並讓下拉 trigger 顯示 label。
const fieldOptions = computed(() =>
  [
    t('consult.fieldStyling'),
    t('consult.fieldGraphic'),
    t('consult.fieldInterior'),
    t('consult.fieldArchitecture')
  ].map((field) => ({ label: field, value: field }))
);

const focusOptions = computed(() =>
  [
    t('consult.focusSpatial'),
    t('consult.focusMaterial'),
    t('consult.focusColor'),
    t('consult.focusFurniture'),
    t('consult.focusVisual')
  ].map((focus) => ({ label: focus, value: focus }))
);

const fieldErrors = computed(() => {
  if (!hasSubmitted.value) {
    return {};
  }

  const contactPhone = form.contactPhone.trim();

  return {
    date: form.date ? '' : t('consult.errDate'),
    timeSlot: form.timeSlot ? '' : t('consult.errTimeSlot'),
    designField: '',
    designFocus: '',
    name: form.name.trim() ? '' : t('consult.errName'),
    email: emailPattern.test(form.email.trim()) ? '' : t('consult.errEmail'),
    contactPhone: !contactPhone
      ? t('consult.errPhoneRequired')
      : phonePattern.test(contactPhone)
        ? ''
        : t('consult.errPhoneInvalid'),
    paymentConfirmed: form.paymentConfirmed ? '' : t('consult.errPayment')
  };
});

watch(
  () => [props.accountName, props.accountEmail],
  ([accountName, accountEmail]) => {
    if (!hasEditedName.value && !form.name.trim()) {
      form.name = accountName;
    }

    if (!hasEditedEmail.value && !form.email.trim()) {
      form.email = accountEmail;
    }
  },
  { immediate: true }
);

function updateName(value: string) {
  hasEditedName.value = true;
  form.name = value;
}

function updateEmail(value: string) {
  hasEditedEmail.value = true;
  form.email = value;
}

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
  if (props.submitting) {
    return;
  }

  Object.assign(form, defaultForm());
  hasSubmitted.value = false;
  hasEditedName.value = false;
  hasEditedEmail.value = false;
  isDatePickerOpen.value = false;
  closeDropdowns();
  datePickerRef.value?.resetMonth();
  emit('reset');
}

function handleSubmit() {
  if (props.submitting) {
    return;
  }

  hasSubmitted.value = true;

  if (Object.values(fieldErrors.value).some(Boolean)) {
    return;
  }

  emit('submit', {
    ...form,
    timeSlot: form.timeSlot as SubmittedTimeSlot
  });
}
</script>

<template>
  <form class="recommendation-panel" novalidate @submit.prevent="handleSubmit">
    <div class="recommendation-panel__section">
      <p class="recommendation-panel__label">{{ $t('consult.method') }}</p>
      <div class="recommendation-panel__radio-grid">
        <label class="recommendation-panel__choice">
          <input v-model="form.method" type="radio" value="online" />
          <span>{{ $t('consult.online') }}</span>
        </label>
        <label class="recommendation-panel__choice">
          <input v-model="form.method" type="radio" value="in_person" />
          <span>{{ $t('consult.inPerson') }}</span>
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
        :label="$t('consult.timeSlot')"
        :placeholder="$t('consult.timeSlotPlaceholder')"
        :list-label="$t('consult.chooseTimeSlot')"
        :options="timeSlotOptions"
        :error="fieldErrors.timeSlot"
        uppercase-value
        @update:open="(value) => handleDropdownOpen('timeSlot', value)"
      />

      <ConsultationDropdown
        v-model="form.designField"
        :open="isDesignFieldOpen"
        :label="$t('consult.designField')"
        :placeholder="$t('consult.selectField')"
        :list-label="$t('consult.chooseField')"
        :options="fieldOptions"
        :error="fieldErrors.designField"
        @update:open="(value) => handleDropdownOpen('designField', value)"
      />

      <ConsultationDropdown
        v-model="form.designFocus"
        :open="isDesignFocusOpen"
        :label="$t('consult.designFocus')"
        :placeholder="$t('consult.selectFocus')"
        :list-label="$t('consult.chooseFocus')"
        :options="focusOptions"
        :error="fieldErrors.designFocus"
        @update:open="(value) => handleDropdownOpen('designFocus', value)"
      />
    </div>

    <div class="recommendation-panel__grid">
      <label class="recommendation-panel__field">
        <span>{{ $t('consult.name') }}</span>
        <FormInput
          :model-value="form.name"
          :placeholder="$t('consult.namePlaceholder')"
          @update:model-value="updateName"
        />
        <small v-if="fieldErrors.name">{{ fieldErrors.name }}</small>
      </label>

      <label class="recommendation-panel__field">
        <span>{{ $t('consult.email') }}</span>
        <FormInput
          :model-value="form.email"
          type="email"
          placeholder="your@email.com"
          @update:model-value="updateEmail"
        />
        <small v-if="fieldErrors.email">{{ fieldErrors.email }}</small>
      </label>

      <label class="recommendation-panel__field recommendation-panel__field--wide">
        <span>{{ $t('consult.contactPhone') }}</span>
        <FormInput v-model="form.contactPhone" placeholder="+886 912 345 678" autocomplete="tel" />
        <small v-if="fieldErrors.contactPhone">{{ fieldErrors.contactPhone }}</small>
      </label>
    </div>

    <label class="recommendation-panel__field">
      <span>{{ $t('consult.notes') }}</span>
      <textarea
        v-model="form.notes"
        class="recommendation-panel__textarea"
        :placeholder="$t('consult.notesPlaceholder')"
        rows="5"
      />
    </label>

    <section class="recommendation-panel__fee" aria-labelledby="consultation-fee-title">
      <p id="consultation-fee-title" class="recommendation-panel__label">{{ $t('consult.fee') }}</p>
      <div class="recommendation-panel__fee-detail">
        <p class="recommendation-panel__fee-amount">{{ $t('consult.feeAmount') }}</p>
        <p class="recommendation-panel__fee-copy">
          {{ $t('consult.feeCopy') }}
        </p>
      </div>

      <label class="recommendation-panel__payment-confirmation">
        <input v-model="form.paymentConfirmed" type="checkbox" />
        <span>{{ $t('consult.paymentConfirm') }}</span>
      </label>
      <small v-if="fieldErrors.paymentConfirmed">{{ fieldErrors.paymentConfirmed }}</small>
    </section>

    <div class="recommendation-panel__actions">
      <Button
        type="submit"
        :disabled="submitting"
        class="disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
      >
        {{ submitting ? $t('consult.preparingCheckout') : $t('consult.confirmPay') }}
      </Button>
      <Button
        type="button"
        variant="secondary"
        :disabled="submitting"
        class="disabled:cursor-not-allowed disabled:opacity-50"
        @click="resetForm"
      >
        {{ $t('consult.reset') }}
      </Button>
    </div>
  </form>
</template>

<style scoped>
.recommendation-panel {
  --recommendation-panel-menu-bg: #2b2b2f;

  display: grid;
  gap: 32px;
  padding: clamp(24px, 5vw, 46px);
  border: 1px solid #ffffff29;
  border-radius: 8px;
  background: radial-gradient(circle at 14% 0%, #ffffff2e, transparent 34%), #ffffff0e;
  box-shadow:
    inset 1px 1px 1px #ffffff29,
    0 24px 80px #00000057;
  backdrop-filter: blur(18px);
}

.recommendation-panel__section {
  display: grid;
  gap: 12px;
}

.recommendation-panel__label,
.recommendation-panel__field > span {
  color: #f0ede6d6;
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
  color: #f0ede6b8;
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
  background-color: #ffffff12;
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
  background-color: #ffffff1c;
}

.recommendation-panel__field small {
  color: var(--color-stellar-red);
  font-family: var(--font-family-mono);
  font-size: 0.7rem;
}

.recommendation-panel__fee {
  display: grid;
  gap: 0;
}

.recommendation-panel__fee-detail {
  display: grid;
  gap: 8px;
  margin-top: 10px;
  padding: 14px 16px;
  border: 1px solid #ffffff14;
  border-radius: 8px;
}

.recommendation-panel__fee-amount {
  color: var(--color-text-primary);
  font-family: var(--font-family-mono);
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.recommendation-panel__fee-copy {
  color: #f0ede6ad;
  font-size: 0.82rem;
  line-height: 1.55;
}

.recommendation-panel__payment-confirmation {
  display: inline-flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 32px;
  color: #f0ede6d1;
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
  margin-top: 8px;
  color: var(--color-stellar-red);
  font-family: var(--font-family-mono);
  font-size: 0.7rem;
}

.recommendation-panel__demo-note {
  margin-top: 14px;
  color: #f0ede6ad;
  font-size: 12px;
  line-height: 1.55;
}

.recommendation-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

@media (max-width: 720px) {
  .recommendation-panel__grid {
    grid-template-columns: 1fr;
  }
}
</style>
