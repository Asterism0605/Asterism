<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import ConsultationsEmptyState from '@/components/feature/consultations/ConsultationsEmptyState.vue';
import DateTimeline from '@/components/feature/consultations/DateTimeline.vue';
import DetailPanel from '@/components/feature/consultations/DetailPanel.vue';
import EmptyStateBackground from '@/components/feature/consultations/EmptyStateBackground.vue';
import OrbitBackground from '@/components/feature/consultations/OrbitBackground.vue';
import Button from '@/components/ui/Button.vue';
import { getUpcomingAccountConsultations } from '@/services/account-consultation.service';
import { useAuthStore } from '@/stores/auth.store';
import type { AccountConsultation } from '@/types/account-consultation';
import type { ApiError } from '@/types/api';

type LoadError = Pick<ApiError, 'code' | 'message' | 'status' | 'details'>;

const router = useRouter();
const authStore = useAuthStore();
const reservations = ref<AccountConsultation[]>([]);
const isLoading = ref(true);
const loadError = ref<LoadError | null>(null);
const selectedId = ref(reservations.value[0]?.id ?? '');
const showAllConsultations = ref(false);
const detailsPanel = ref<InstanceType<typeof DetailPanel> | null>(null);
const selectedReservation = computed<AccountConsultation>(
  () =>
    reservations.value.find((reservation) => reservation.id === selectedId.value) ??
    reservations.value[0]!
);

async function loadReservations(): Promise<void> {
  const accessToken = authStore.session?.accessToken;
  reservations.value = [];
  selectedId.value = '';
  loadError.value = null;

  if (!authStore.isAuthenticated || !accessToken) {
    isLoading.value = false;
    return;
  }

  isLoading.value = true;

  try {
    reservations.value = await getUpcomingAccountConsultations(accessToken);
    selectedId.value = reservations.value[0]?.id ?? '';
  } catch (error) {
    const apiError = error as LoadError;

    if (apiError.status === 401) {
      await authStore.logout();
      await router.replace({ name: 'login', query: { next: router.currentRoute.value.fullPath } });
      return;
    }

    loadError.value = apiError;
  } finally {
    isLoading.value = false;
  }
}

async function selectReservation(reservationId: string): Promise<void> {
  selectedId.value = reservationId;
  showAllConsultations.value = false;
  await nextTick();
  detailsPanel.value?.playDateAnimation();
}

function startConsultation(): void {
  void router.push({ name: 'consultant' });
}

onMounted(() => {
  void loadReservations();
});
</script>

<template>
  <main class="consultations-page">
    <EmptyStateBackground v-if="isLoading || loadError || reservations.length === 0" />
    <OrbitBackground v-else />

    <section v-if="isLoading" class="consultations-page__status" role="status">
      {{ $t('accountConsultations.loading') }}
    </section>

    <section v-else-if="loadError" class="consultations-page__status" role="alert">
      <p>{{ $t('accountConsultations.loadError') }}</p>
      <Button type="button" variant="primary" @click="loadReservations">
        {{ $t('accountConsultations.retry') }}
      </Button>
    </section>

    <ConsultationsEmptyState
      v-else-if="reservations.length === 0"
      @action="startConsultation"
    />

    <template v-else>
      <DateTimeline
        :reservations="reservations"
        :selected-id="selectedId"
        :show-all="showAllConsultations"
        @select="selectReservation"
      />

      <DetailPanel
        ref="detailsPanel"
        :reservation="selectedReservation"
        :reservations="reservations"
        :show-all="showAllConsultations"
        @toggle-view="showAllConsultations = !showAllConsultations"
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
