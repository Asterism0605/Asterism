<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { CalendarDays, RefreshCw, UserRound } from '@lucide/vue';
import { getMyConsultationBookings } from '@/api/consultation.api';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import Button from '@/components/ui/Button.vue';
import { useAuthStore } from '@/stores/auth.store';
import type {
  ConsultationBookingList,
  ConsultationBookingListItem,
  ConsultationBookingMethod,
  ConsultationTimeSlot
} from '@/types/consultation';

type PageStatus = 'loading' | 'success' | 'empty' | 'error';

const authStore = useAuthStore();
const router = useRouter();
const { locale, t } = useI18n();

const status = ref<PageStatus>('loading');
const bookings = ref<ConsultationBookingList>([]);

const successfulBookings = computed(() =>
  bookings.value.filter((item) => ['confirmed', 'completed'].includes(item.booking.status))
);
const hasBookings = computed(() => successfulBookings.value.length > 0);

function formatDate(value: string): string {
  const parts = value.split('-').map(Number);
  const date =
    parts.length === 3 && parts.every((part) => Number.isFinite(part))
      ? new Date(parts[0], parts[1] - 1, parts[2])
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

function methodLabel(method: ConsultationBookingMethod): string {
  return t(`accountConsultations.methods.${method}`);
}

function timeSlotLabel(timeSlot: ConsultationTimeSlot): string {
  return t(`accountConsultations.timeSlots.${timeSlot}`);
}

function consultantName(item: ConsultationBookingListItem): string {
  return item.consultant?.displayName || t('accountConsultations.unassignedConsultant');
}

function consultantTitle(item: ConsultationBookingListItem): string {
  return item.consultant?.title || '';
}

function hasExtraDetails(item: ConsultationBookingListItem): boolean {
  return Boolean(item.booking.designField || item.booking.designFocus || item.booking.notes);
}

async function loadBookings(): Promise<void> {
  const accessToken = authStore.session?.accessToken ?? '';

  if (!accessToken) {
    status.value = 'error';
    return;
  }

  status.value = 'loading';

  try {
    const response = await getMyConsultationBookings(accessToken);

    if (!response.success) {
      status.value = 'error';
      return;
    }

    bookings.value = response.data;
    status.value = successfulBookings.value.length > 0 ? 'success' : 'empty';
  } catch {
    status.value = 'error';
  }
}

function goToConsultantBooking(): void {
  router.push({ name: 'consultant' });
}

onMounted(loadBookings);
</script>

<template>
  <main class="account-consultations">
    <div class="account-consultations__background" aria-hidden="true">
      <ConstellationBackground
        class-name="account-consultations__constellation account-consultations__constellation--left consultations-constellation"
        size="36vw"
        :line-length="180"
        :center-size="7"
        :node-size="5"
        :active="true"
        :spacing="42"
        :intensity="0.62"
      />
      <ConstellationBackground
        class-name="account-consultations__constellation account-consultations__constellation--right consultations-constellation"
        size="42vw"
        :line-length="210"
        :center-size="6"
        :node-size="4"
        :active="true"
        :spacing="46"
        :intensity="0.5"
      />
    </div>

    <section class="account-consultations__shell">
      <header class="account-consultations__header">
        <p class="account-consultations__eyebrow">{{ $t('accountConsultations.eyebrow') }}</p>
        <h1 class="text-h1">{{ $t('accountConsultations.title') }}</h1>
        <p class="account-consultations__subtitle">{{ $t('accountConsultations.subtitle') }}</p>
      </header>

      <section v-if="status === 'loading'" class="account-consultations__state" role="status">
        <RefreshCw
          class="account-consultations__state-icon account-consultations__state-icon--spin"
        />
        <p>{{ $t('accountConsultations.loading') }}</p>
      </section>

      <section
        v-else-if="status === 'empty'"
        class="account-consultations__state"
        data-testid="consultations-empty"
      >
        <CalendarDays class="account-consultations__state-icon" />
        <h2 class="text-h3">{{ $t('accountConsultations.emptyTitle') }}</h2>
        <p>{{ $t('accountConsultations.emptyDescription') }}</p>
        <Button type="button" @click="goToConsultantBooking">
          {{ $t('accountConsultations.bookConsultation') }}
        </Button>
      </section>

      <section
        v-else-if="status === 'error'"
        class="account-consultations__state"
        role="alert"
        data-testid="consultations-error"
      >
        <RefreshCw class="account-consultations__state-icon" />
        <h2 class="text-h3">{{ $t('accountConsultations.errorTitle') }}</h2>
        <p>{{ $t('accountConsultations.errorDescription') }}</p>
        <Button type="button" variant="secondary" @click="loadBookings">
          {{ $t('accountConsultations.retry') }}
        </Button>
      </section>

      <section v-else-if="hasBookings" class="account-consultations__list" aria-live="polite">
        <article
          v-for="item in successfulBookings"
          :key="item.booking.id"
          class="consultation-card"
          :data-booking-id="item.booking.id"
        >
          <div class="consultation-card__main">
            <div class="consultation-card__date">
              <CalendarDays class="consultation-card__icon" />
              {{ formatDate(item.booking.consultationDate) }}
            </div>

            <div class="consultation-card__consultant">
              <UserRound class="consultation-card__icon" />
              <span>
                <strong>{{ consultantName(item) }}</strong>
                <small v-if="consultantTitle(item)">{{ consultantTitle(item) }}</small>
              </span>
            </div>
          </div>

          <div class="consultation-card__meta" aria-label="booking summary">
            <span>{{ timeSlotLabel(item.booking.timeSlot) }}</span>
            <span>{{ methodLabel(item.booking.method) }}</span>
          </div>

          <dl v-if="hasExtraDetails(item)" class="consultation-card__detail-grid">
            <div v-if="item.booking.designField">
              <dt>{{ $t('accountConsultations.designField') }}</dt>
              <dd>{{ item.booking.designField }}</dd>
            </div>
            <div v-if="item.booking.designFocus">
              <dt>{{ $t('accountConsultations.designFocus') }}</dt>
              <dd>{{ item.booking.designFocus }}</dd>
            </div>
            <div v-if="item.booking.notes" class="consultation-card__detail-grid-wide">
              <dt>{{ $t('accountConsultations.notes') }}</dt>
              <dd>{{ item.booking.notes }}</dd>
            </div>
          </dl>

          <p v-else class="consultation-card__muted">
            {{ $t('accountConsultations.noExtraDetails') }}
          </p>
        </article>
      </section>
    </section>
  </main>
</template>

<style scoped>
.account-consultations {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 72% 48%, #f0ede614, transparent 24%),
    linear-gradient(135deg, var(--color-void) 0%, var(--color-deep) 62%, #15151b 100%);
  color: var(--color-text-primary);
}

.account-consultations__background {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.72;
}

:deep(.account-consultations__constellation) {
  position: absolute;
}

:deep(.account-consultations__constellation--left) {
  left: -10vw;
  bottom: -20px;
  opacity: 0.4;
}

:deep(.account-consultations__constellation--right) {
  right: -5vw;
  top: 18vh;
}

:deep(.consultations-constellation) {
  animation: consultations-fade-in 1500ms ease infinite alternate;
}

:deep(.account-consultations__constellation--left.consultations-constellation) {
  animation-name: consultations-fade-in-muted;
  animation-delay: 0ms;
}

:deep(.account-consultations__constellation--right.consultations-constellation) {
  animation-delay: -3000ms;
}

:deep(.consultations-constellation .constellation-background__canvas) {
  animation: consultations-scale-in 620ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.account-consultations__shell {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 32px;
  width: min(1180px, calc(100% - 40px));
  min-height: 100vh;
  margin: 0 auto;
  padding: clamp(116px, 14vh, 148px) 0 68px;
}

.account-consultations__header {
  display: grid;
  gap: 12px;
  max-width: 720px;
}

.account-consultations__eyebrow {
  font-family: var(--font-family-mono);
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  color: var(--color-gold-dim);
  text-transform: uppercase;
}

.account-consultations__header h1 {
  font-size: clamp(2rem, 5vw, 2.75rem);
  font-weight: 500;
  line-height: var(--leading-tight);
}

.account-consultations__subtitle {
  max-width: 620px;
  color: #f0ede6b8;
  font-size: var(--text-body);
  line-height: 1.6;
}

.account-consultations__state {
  display: grid;
  justify-items: start;
  gap: 16px;
  padding: clamp(24px, 5vw, 46px);
  border: 1px solid #ffffff29;
  border-radius: 8px;
  background: radial-gradient(circle at 14% 0%, #ffffff2e, transparent 34%), #ffffff0e;
  box-shadow:
    inset 1px 1px 1px #ffffff29,
    0 24px 80px #00000057;
  backdrop-filter: blur(18px);
}

.account-consultations__state p {
  color: #f0ede6b8;
  line-height: 1.6;
}

.account-consultations__state-icon {
  width: 28px;
  height: 28px;
  color: var(--color-gold-dim);
}

.account-consultations__state-icon--spin {
  animation: consultations-spin 900ms linear infinite;
}

.account-consultations__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  align-items: stretch;
  gap: 18px;
}

.consultation-card {
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 20px;
  height: 360px;
  overflow: hidden;
  padding: clamp(22px, 4vw, 32px);
  border: 1px solid #ffffff29;
  border-radius: 8px;
  background: radial-gradient(circle at 14% 0%, #ffffff2e, transparent 34%), #ffffff0e;
  box-shadow:
    inset 1px 1px 1px #ffffff29,
    0 24px 80px #00000057;
  backdrop-filter: blur(18px);
}

.consultation-card__main {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.consultation-card__date,
.consultation-card__consultant {
  display: flex;
  align-items: center;
  gap: 10px;
}

.consultation-card__date {
  font-family: var(--font-family-title);
  font-size: var(--text-h3);
  font-weight: 600;
  line-height: var(--leading-tight);
}

.consultation-card__consultant strong {
  display: block;
  color: #f0ede6d6;
  font-size: 0.9rem;
  font-weight: 600;
}

.consultation-card__consultant small {
  display: block;
  margin-top: 2px;
  color: #f0ede6ad;
  font-size: 0.82rem;
  line-height: 1.55;
}

.consultation-card__icon {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  color: var(--color-gold-dim);
}

.consultation-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.consultation-card__meta span {
  min-height: 32px;
  padding: 7px 10px;
  border: 1px solid #ffffff14;
  border-radius: 8px;
  background: #ffffff08;
  color: #f0ede6b8;
  font-size: 0.82rem;
  white-space: nowrap;
}

.consultation-card__detail-grid {
  display: grid;
  gap: 12px;
  align-content: start;
  min-height: 0;
}

.consultation-card__detail-grid div {
  min-width: 0;
}

.consultation-card__detail-grid dt {
  margin-bottom: 4px;
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.consultation-card__detail-grid dd {
  color: #f0ede6d1;
  font-size: 0.9rem;
  line-height: 1.6;
}

.consultation-card__detail-grid-wide dd {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.consultation-card__muted {
  align-self: start;
  color: #f0ede6ad;
  font-size: 0.9rem;
  line-height: 1.6;
}

@media (max-width: 980px) {
  .account-consultations {
    overflow-y: auto;
  }

  .account-consultations__shell {
    min-height: 0;
  }
}

@media (max-width: 760px) {
  .account-consultations__shell {
    width: min(100% - 28px, 1180px);
    padding-top: 104px;
    padding-bottom: 42px;
  }

  :deep(.consultations-constellation) {
    animation-name: consultations-fade-in-mobile;
  }

  :deep(.account-consultations__constellation--left.consultations-constellation) {
    animation-name: consultations-fade-in-mobile;
  }

  .account-consultations__list {
    grid-template-columns: 1fr;
  }

  .consultation-card {
    height: 360px;
  }
}

@keyframes consultations-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes consultations-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes consultations-fade-in-muted {
  from {
    opacity: 0;
  }

  to {
    opacity: 0.4;
  }
}

@keyframes consultations-fade-in-mobile {
  from {
    opacity: 0;
  }

  to {
    opacity: 0.3;
  }
}

@keyframes consultations-scale-in {
  from {
    transform: scale(0.82);
  }

  to {
    transform: scale(1);
  }
}
</style>
