<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import ConsultationPaymentResult from '@/components/feature/consultant/ConsultationPaymentResult.vue';
import ConsultantSummary from '@/components/feature/consultant/ConsultantSummary.vue';
import RecommendationPanel from '@/components/feature/consultant/RecommendationPanel.vue';
import { useConsultationPaymentFlow } from '@/composables/useConsultationPaymentFlow';
import type { PaymentReturnStatus } from '@/composables/useConsultationPaymentFlow';
import {
  loadActiveConsultants,
  matchConsultantByDesignField,
  type ConsultantLoadStatus,
  type ConsultantRow
} from '@/services/consultant.service';
import { useAuthStore } from '@/stores/auth.store';
import { useStyleDnaStore } from '@/stores/style-dna.store';

interface ConsultantProfile {
  styleDna: Array<{
    label: string;
    percentage: number;
  }>;
  consultantLabel: string | null;
  // 顯示的顧問是後端已確認指派的（true）還是表單即時預覽的（false）。
  // 預覽時標籤用「可能配對顧問」，確認後才用「配對顧問」。
  matchIsConfirmed: boolean;
}

const PAYMENT_RETURN_COPY = {
  confirming: {
    title: 'consult.paymentConfirmingTitle',
    description: 'consult.paymentConfirmingDescription'
  },
  processing: {
    title: 'consult.paymentProcessingTitle',
    description: 'consult.paymentProcessingDescription'
  },
  paid: {
    title: 'consult.paymentPaidTitle',
    description: 'consult.paymentPaidDescription'
  },
  failed: {
    title: 'consult.paymentFailedTitle',
    description: 'consult.paymentFailedDescription'
  },
  'processing-timeout': {
    title: 'consult.paymentTimeoutTitle',
    description: 'consult.paymentTimeoutDescription'
  },
  unauthenticated: {
    title: 'consult.paymentUnauthenticatedTitle',
    description: 'consult.paymentUnauthenticatedDescription'
  },
  canceled: {
    title: 'consult.paymentCanceledTitle',
    description: 'consult.paymentCanceledDescription'
  },
  'missing-booking-id': {
    title: 'consult.paymentMissingTitle',
    description: 'consult.paymentMissingDescription'
  },
  error: {
    title: 'consult.paymentErrorTitle',
    description: 'consult.paymentErrorDescription'
  }
} satisfies Record<
  Exclude<PaymentReturnStatus, 'idle'>,
  { title: string; description: string }
>;

const authStore = useAuthStore();
const styleDnaStore = useStyleDnaStore();
const route = useRoute();
const { t } = useI18n();

// 顧問清單只在掛載時抓一次(is_active 名單不會在同一次頁面停留期間變動)，
// 表單選設計領域時純前端查表配對，不用每次都打一次 API。
const consultants = ref<ConsultantRow[]>([]);
const selectedDesignField = ref('');
// 空的 consultants 陣列有兩種可能：還沒載入完 / 載入失敗。用 loadStatus 區分，
// 避免把「載入失敗」畫成「尚未配對」，讓使用者以為只是在等操作。
const loadStatus = ref<ConsultantLoadStatus>('idle');

onMounted(async () => {
  loadStatus.value = 'loading';
  try {
    consultants.value = await loadActiveConsultants();
    loadStatus.value = 'success';
  } catch (e) {
    loadStatus.value = 'error';
    console.warn('[consultant] fetch active consultants failed:', e);
  }
});

const sourceImageId = computed(() => {
  const rawSourceImageId = route.query.sourceImageId;

  return typeof rawSourceImageId === 'string' ? rawSourceImageId : '';
});
// 從登入會員資料帶入預約表單的姓名與 Email
const accountName = computed(() => authStore.user?.displayName ?? '');
const accountEmail = computed(() => authStore.user?.email ?? '');
const {
  checkoutErrorMessage,
  isCheckoutSubmitting,
  paymentReturnStatus,
  confirmedConsultant,
  handleSubmit,
  handleReset,
  restartBooking
} = useConsultationPaymentFlow(sourceImageId);

const matchedConsultant = computed(() =>
  matchConsultantByDesignField(selectedDesignField.value, consultants.value)
);

const profile = computed<ConsultantProfile>(() => {
  const result = authStore.isAuthenticated ? styleDnaStore.currentResult : null;

  return {
    styleDna: result?.styles ?? [],
    consultantLabel: consultantLabel.value,
    matchIsConfirmed: Boolean(confirmedConsultant.value)
  };
});

// 顧問標籤依狀態顯示,涵蓋 reviewer 指出的多種情境:
// 1. 後端已確認指派 → 顯示真正的顧問(不限 paid,只要 API 回了 confirmedConsultant)。
// 2. 付款流程中但沒有顧問資料 → 表單已隱藏、選不了領域,不能顯示「選擇設計領域後配對」。
// 3. 顧問清單載入失敗 → 明確錯誤,不要假裝在等操作。
// 4. 尚未選設計領域 → null,交給 ConsultantSummary 顯示待配對文案。
// 5. 選了領域但查無對應 active 顧問 → 明確「沒有可配對顧問」。
// 6. 一般情況 → 表單即時預覽配對(標籤會標成「可能配對顧問」)。
const consultantLabel = computed<string | null>(() => {
  if (confirmedConsultant.value) {
    return confirmedConsultant.value.displayName;
  }
  if (paymentReturnStatus.value !== 'idle') {
    return t('consult.matchedConsultantUnavailable');
  }
  if (loadStatus.value === 'error') {
    return t('consult.matchedConsultantLoadError');
  }
  if (!selectedDesignField.value) {
    return null;
  }
  return matchedConsultant.value?.displayName ?? t('consult.matchedConsultantNone');
});
const paymentReturnCopy = computed(() => {
  if (paymentReturnStatus.value === 'idle') {
    return null;
  }

  const copy = PAYMENT_RETURN_COPY[paymentReturnStatus.value];

  return {
    title: t(copy.title),
    description: t(copy.description)
  };
});

</script>

<template>
  <main class="style-consultant" :data-source-image-id="sourceImageId || undefined">
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
      <ConsultantSummary :profile="profile" />

      <div class="style-consultant__booking">
        <ConsultationPaymentResult
          v-if="paymentReturnCopy"
          :title="paymentReturnCopy.title"
          :description="paymentReturnCopy.description"
          :show-my-bookings-link="paymentReturnStatus === 'paid'"
          @restart="restartBooking"
        />

        <RecommendationPanel
          v-else
          :account-name="accountName"
          :account-email="accountEmail"
          :submitting="isCheckoutSubmitting"
          @submit="handleSubmit"
          @reset="handleReset"
          @design-field-change="selectedDesignField = $event"
        />

        <p v-if="checkoutErrorMessage" class="style-consultant__confirmation" role="alert">
          {{ checkoutErrorMessage }}
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
    radial-gradient(circle at 72% 48%, #f0ede614, transparent 24%),
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
  border: 1px solid #a8893a66;
  border-radius: 8px;
  background: #a8893a1a;
  color: #f0ede6d1;
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
