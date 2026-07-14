<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';
import ConsultationsEmptyState from '@/components/feature/consultations/ConsultationsEmptyState.vue';
import DateTimeline from '@/components/feature/consultations/DateTimeline.vue';
import DetailPanel from '@/components/feature/consultations/DetailPanel.vue';
import EmptyStateBackground from '@/components/feature/consultations/EmptyStateBackground.vue';
import OrbitBackground from '@/components/feature/consultations/OrbitBackground.vue';
import type { AccountConsultation } from '@/types/account-consultation';

const router = useRouter();
const reservations = (
  [
    {
      id: 'reservation-01',
      status: 'confirmed',
      consultationDate: '2026-07-28',
      timeSlot: 'am',
      method: 'Online',
      designField: 'Graphic Design',
      designFocus: 'Visual Concept',
      notes: 'I would like help defining the visual direction for a new brand identity.'
    },
    {
      id: 'reservation-02',
      status: 'confirmed',
      consultationDate: '2026-08-10',
      timeSlot: 'pm',
      method: 'In-Person',
      designField: 'Interior Design',
      designFocus: 'Material Palette',
      notes: 'I need advice on natural finishes and a calm material palette for my home.'
    },
    {
      id: 'reservation-03',
      status: 'confirmed',
      consultationDate: '2026-10-01',
      timeSlot: 'am',
      method: 'Online',
      designField: 'Architecture',
      designFocus: 'Spatial Mood',
      notes: 'I want to create a warm and quiet atmosphere for a small studio renovation.'
    },
    {
      id: 'reservation-04',
      status: 'confirmed',
      consultationDate: '2026-11-16',
      timeSlot: 'pm',
      method: 'Online',
      designField: 'Styling Design',
      designFocus: 'Color Direction',
      notes: 'I would like to refine the color direction for an upcoming editorial shoot.'
    },
    {
      id: 'reservation-05',
      status: 'confirmed',
      consultationDate: '2027-01-08',
      timeSlot: 'am',
      method: 'In-Person',
      designField: 'Interior Design',
      designFocus: 'Furniture Selection',
      notes: 'I need help selecting furniture that works with the scale of my living room.'
    }
  ] satisfies AccountConsultation[]
).sort((a, b) => a.consultationDate.localeCompare(b.consultationDate));

const selectedId = ref(reservations[0]?.id ?? '');
const showAllConsultations = ref(false);
const detailsPanel = ref<InstanceType<typeof DetailPanel> | null>(null);
const selectedReservation = computed<AccountConsultation>(
  () => reservations.find((reservation) => reservation.id === selectedId.value) ?? reservations[0]!
);

async function selectReservation(reservationId: string): Promise<void> {
  selectedId.value = reservationId;
  showAllConsultations.value = false;
  await nextTick();
  detailsPanel.value?.playDateAnimation();
}

function startConsultation(): void {
  void router.push({ name: 'consultant' });
}
</script>

<template>
  <main class="consultations-page">
    <EmptyStateBackground v-if="reservations.length === 0" />
    <OrbitBackground v-else />

    <ConsultationsEmptyState v-if="reservations.length === 0" @action="startConsultation" />

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
</style>
