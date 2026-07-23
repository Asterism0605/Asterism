<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ConsultationsEmptyState from '@/components/feature/consultations/ConsultationsEmptyState.vue';
import DateTimeline from '@/components/feature/consultations/DateTimeline.vue';
import DetailPanel from '@/components/feature/consultations/DetailPanel.vue';
import EmptyStateBackground from '@/components/feature/consultations/EmptyStateBackground.vue';
import OrbitBackground from '@/components/feature/consultations/OrbitBackground.vue';
import Button from '@/components/ui/Button.vue';
import {
  loadAssignedBookings,
  saveConsultationLocation
} from '@/services/consultant-booking.service';
import { useAuthStore } from '@/stores/auth.store';
import type { ConsultantBookingItem } from '@/types/account-consultation';

const authStore = useAuthStore();
const { t } = useI18n();
const bookings = ref<ConsultantBookingItem[]>([]);
const isLoading = ref(true);
const hasLoadError = ref(false);
const selectedId = ref('');
const showAllBookings = ref(false);
const locationSaveError = ref('');
// 正在儲存地點的預約 id。儲存中停用按鈕並顯示「儲存中」,避免顧問連續點擊送出多個 RPC——
// 否則多個請求完成順序不同時,較舊的地點可能反而覆蓋最後一次輸入。
const savingLocationId = ref('');
const detailsPanel = ref<InstanceType<typeof DetailPanel> | null>(null);
const selectedBooking = computed<ConsultantBookingItem>(
  () => bookings.value.find((booking) => booking.id === selectedId.value) ?? bookings.value[0]!
);

async function loadBookings(): Promise<void> {
  // guard 已保證是顧問;consultantId 不在只可能是狀態尚未還原,當空清單處理。
  const consultantId = authStore.user?.consultantId;
  if (!consultantId) {
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  hasLoadError.value = false;

  try {
    bookings.value = await loadAssignedBookings(consultantId);
    selectedId.value = bookings.value[0]?.id ?? '';
  } catch {
    hasLoadError.value = true;
  } finally {
    isLoading.value = false;
  }
}

async function handleUpdateLocation(location: string): Promise<void> {
  const booking = selectedBooking.value;
  if (!booking) return;
  // in-flight guard:同一筆還在儲存就不重送(按鈕也已停用,這是第二層保險)。
  if (savingLocationId.value === booking.id) return;
  savingLocationId.value = booking.id;
  try {
    await saveConsultationLocation(booking.id, location);
    booking.location = location === '' ? undefined : location;
    if (booking.id === selectedId.value) {
      locationSaveError.value = '';
    }
  } catch {
    if (booking.id === selectedId.value) {
      locationSaveError.value = t('consult.locationSaveFailed');
    }
  } finally {
    savingLocationId.value = '';
  }
}

async function selectBooking(bookingId: string): Promise<void> {
  selectedId.value = bookingId;
  showAllBookings.value = false;
  locationSaveError.value = '';
  await nextTick();
  detailsPanel.value?.playDateAnimation();
}

onMounted(() => {
  void loadBookings();
});
</script>

<template>
  <main class="consultations-page">
    <EmptyStateBackground v-if="isLoading || hasLoadError || bookings.length === 0" />
    <OrbitBackground v-else />

    <section v-if="isLoading" class="consultations-page__status" role="status">
      {{ $t('consultantBookings.loading') }}
    </section>

    <section v-else-if="hasLoadError" class="consultations-page__status" role="alert">
      <p>{{ $t('consultantBookings.loadError') }}</p>
      <Button type="button" variant="primary" @click="loadBookings">
        {{ $t('consultantBookings.retry') }}
      </Button>
    </section>

    <ConsultationsEmptyState v-else-if="bookings.length === 0" variant="consultant" />

    <template v-else>
      <DateTimeline
        :reservations="bookings"
        :selected-id="selectedId"
        :show-all="showAllBookings"
        scope="consultantBookings"
        @select="selectBooking"
      />

      <DetailPanel
        ref="detailsPanel"
        :reservation="selectedBooking"
        :reservations="bookings"
        :show-all="showAllBookings"
        :save-error="locationSaveError"
        :saving="savingLocationId === selectedBooking.id"
        variant="consultant"
        @toggle-view="showAllBookings = !showAllBookings"
        @update-location="handleUpdateLocation"
      />
    </template>
  </main>
</template>

<style scoped>
.consultations-page {
  position: relative;
  width: 100%;
  height: 100svh;
  overflow: hidden;
  background: var(--color-void);
  color: var(--color-text-primary);
  font-family: var(--font-family-title);
}

.consultations-page__status {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  color: #f0ede6b8;
  text-align: center;
}

.consultations-page__status p {
  margin: 0;
}
</style>
