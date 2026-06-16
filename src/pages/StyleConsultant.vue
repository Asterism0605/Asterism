<script setup lang="ts">
import { computed, ref } from 'vue';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import ConsultantSummary from '@/components/feature/consultant/ConsultantSummary.vue';
import RecommendationPanel from '@/components/feature/consultant/RecommendationPanel.vue';
import { useAuthStore } from '@/stores/auth.store';

interface ConsultantProfile {
  styleDna: Array<{
    label: string;
    percentage: number;
  }>;
  consultantLabel: string;
}

interface BookingPayload {
  method: 'online' | 'in-person';
  date: string;
  timeSlot: '' | 'am' | 'pm';
  designField: string;
  designFocus: string;
  name: string;
  email: string;
  notes: string;
}

const authStore = useAuthStore();
const bookingStatus = ref<'idle' | 'submitted'>('idle');
const lastBooking = ref<BookingPayload | null>(null);

const mockProfile: ConsultantProfile = {
  styleDna: [
    { label: 'Luminous Minimalism', percentage: 54 },
    { label: 'Organic Modern', percentage: 28 },
    { label: 'Soft Industrial', percentage: 18 }
  ],
  consultantLabel: 'Spatial Consultant · Mira Chen'
};

// 是否帶入 DNA 測驗 mock data &
const profile = computed(() => mockProfile);
const hasSourceData = computed(() => Boolean(profile.value));
//
const accountName = computed(() => authStore.user?.displayName ?? '');
const accountEmail = computed(() => authStore.user?.email ?? '');

function handleSubmit(payload: BookingPayload) {
  lastBooking.value = payload;
  bookingStatus.value = 'submitted';
}

function handleReset() {
  lastBooking.value = null;
  bookingStatus.value = 'idle';
}
</script>

<template>
  <main class="style-consultant">
    <div class="style-consultant__background" aria-hidden="true">
      <ConstellationBackground
        class-name="style-consultant__constellation style-consultant__constellation--left consultant-constellation"
        size="36vw"
        :line-length="180"
        :center-size="7"
        :node-size="5"
        :active="true"
        :spacing="42"
        :intensity="0.62"
      />
      <ConstellationBackground
        class-name="style-consultant__constellation style-consultant__constellation--right consultant-constellation"
        size="42vw"
        :line-length="210"
        :center-size="6"
        :node-size="4"
        :active="true"
        :spacing="46"
        :intensity="0.5"
      />
    </div>

    <section class="style-consultant__content">
      <ConsultantSummary :profile="profile" :has-source-data="hasSourceData" />

      <div class="style-consultant__booking">
        <RecommendationPanel
          :account-name="accountName"
          :account-email="accountEmail"
          @submit="handleSubmit"
          @reset="handleReset"
        />

        <p
          v-if="bookingStatus === 'submitted' && lastBooking"
          class="style-consultant__confirmation"
          role="status"
        >
          Request received. We’ll contact {{ lastBooking.name }} at
          {{ lastBooking.email }} with the next available consultation details.
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.style-consultant {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 72% 48%, rgb(240 237 230 / 0.08), transparent 24%),
    linear-gradient(135deg, var(--color-void) 0%, var(--color-deep) 62%, #15151b 100%);
  color: var(--color-text-primary);
}

.style-consultant__background {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.72;
}

:deep(.style-consultant__constellation) {
  position: absolute;
}

:deep(.style-consultant__constellation--left) {
  left: -10vw;
  bottom: -20px;
  opacity: 0.4;
}

:deep(.style-consultant__constellation--right) {
  right: -5vw;
  top: 18vh;
}

:deep(.consultant-constellation) {
  animation: consultant-fade-in 1500ms ease infinite alternate;
}

:deep(.style-consultant__constellation--left.consultant-constellation) {
  animation-name: consultant-fade-in-muted;
  animation-delay: 0ms;
}

:deep(.style-consultant__constellation--right.consultant-constellation) {
  animation-delay: -3000ms;
}

:deep(.consultant-constellation .constellation-background__canvas) {
  animation: consultant-scale-in 620ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.style-consultant__content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(360px, 560px);
  gap: clamp(32px, 6vw, 86px);
  align-items: center;
  width: min(1180px, calc(100% - 40px));
  min-height: 100vh;
  margin: 0 auto;
  padding: clamp(116px, 14vh, 148px) 0 68px;
}

.style-consultant__booking {
  display: grid;
  gap: 18px;
}

.style-consultant__confirmation {
  padding: 16px 18px;
  border: 1px solid rgb(168 137 58 / 0.4);
  border-radius: 8px;
  background: rgb(168 137 58 / 0.1);
  color: rgb(240 237 230 / 0.82);
  font-size: 0.9rem;
  line-height: 1.6;
}

@media (max-width: 980px) {
  .style-consultant {
    overflow-y: auto;
  }

  .style-consultant__content {
    grid-template-columns: 1fr;
    align-items: start;
    min-height: 0;
  }
}

@media (max-width: 560px) {
  .style-consultant__content {
    width: min(100% - 28px, 1180px);
    padding-top: 104px;
    padding-bottom: 42px;
  }

  :deep(.consultant-constellation) {
    animation-name: consultant-fade-in-mobile;
  }

  :deep(.style-consultant__constellation--left.consultant-constellation) {
    animation-name: consultant-fade-in-mobile;
  }
}



@keyframes consultant-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes consultant-fade-in-muted {
  from {
    opacity: 0;
  }

  to {
    opacity: 0.4;
  }
}

@keyframes consultant-fade-in-mobile {
  from {
    opacity: 0;
  }

  to {
    opacity: 0.3;
  }
}

@keyframes consultant-scale-in {
  from {
    transform: scale(0.82);
  }

  to {
    transform: scale(1);
  }
}
</style>
