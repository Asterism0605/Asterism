<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ScrambleText from '@/components/effects/ScrambleText.vue';
import Button from '@/components/ui/Button.vue';
import type { AccountConsultation, ConsultantBookingItem } from '@/types/account-consultation';
import { formatConsultationDisplayValue } from '@/utils/consultation-display';
import { isHttpUrl } from '@/utils/http-url';
import ConsultationList from './ConsultationList.vue';

const props = withDefaults(
  defineProps<{
    reservation: ConsultantBookingItem;
    reservations: AccountConsultation[];
    showAll: boolean;
    /** consultant:多渲染客戶聯絡資訊與狀態標籤,i18n 走 consultantBookings。 */
    variant?: 'account' | 'consultant';
    /** 儲存地點失敗時,父層(ConsultantBookings)傳入的錯誤訊息。 */
    saveError?: string;
    /** 地點儲存中:停用按鈕並顯示「儲存中」,避免連續點擊送出多個請求。 */
    saving?: boolean;
  }>(),
  { variant: 'account', saveError: '', saving: false }
);

const scope = computed(() =>
  props.variant === 'consultant' ? 'consultantBookings' : 'accountConsultations'
);

const emit = defineEmits<{
  toggleView: [];
  updateLocation: [value: string];
}>();

const { t } = useI18n();

function displayValue(value?: string): string {
  return formatConsultationDisplayValue(value, t);
}

const dateScramble = ref<InstanceType<typeof ScrambleText> | null>(null);

function displayDate(date: string): string {
  return date.replaceAll('-', ' ');
}

function playDateAnimation(): void {
  dateScramble.value?.play();
}

const isOnline = computed(() => props.reservation.method === 'Online');

const isConfirmed = computed(() => props.reservation.status === 'confirmed');
const canEditLocation = computed(() => props.variant === 'consultant' && isConfirmed.value);
const locationInput = ref(props.reservation.location ?? '');
const locationError = ref('');

watch(
  () => props.reservation.id,
  () => {
    locationInput.value = props.reservation.location ?? '';
    locationError.value = '';
  }
);

function saveLocation(): void {
  const value = locationInput.value.trim();
  if (isOnline.value && value !== '' && !isHttpUrl(value)) {
    locationError.value = t('consult.locationInvalidUrl');
    return;
  }
  locationError.value = '';
  emit('updateLocation', value);
}

defineExpose({ playDateAnimation });
</script>

<template>
  <article
    class="details-panel glass-panel"
    :class="{ 'details-panel--consultant': variant === 'consultant' }"
    aria-live="polite"
  >
    <button
      class="view-all"
      type="button"
      :aria-label="showAll ? t(`${scope}.backToSelectedAria`) : t(`${scope}.viewAllAria`)"
      :aria-expanded="showAll"
      @click="emit('toggleView')"
    >
      {{ showAll ? t(`${scope}.back`) : t(`${scope}.viewAll`) }}
      <span aria-hidden="true">{{ showAll ? '↙' : '↗' }}</span>
    </button>

    <template v-if="!showAll">
      <div class="details-panel__date">
        <time :datetime="reservation.consultationDate">
          <ScrambleText
            ref="dateScramble"
            :text="displayDate(reservation.consultationDate)"
            chars="0123456789 "
            :duration="1.2"
            :autoplay="false"
          />
        </time>
        <span>{{ reservation.timeSlot.toUpperCase() }}</span>
      </div>

      <dl class="consultation-details">
        <div>
          <dt>{{ t('consult.method') }}</dt>
          <dd>
            {{ displayValue(reservation.method) }}
            <template v-if="reservation.location">
              /
              <a
                v-if="isOnline && isHttpUrl(reservation.location)"
                :href="reservation.location"
                target="_blank"
                rel="noopener noreferrer"
                >{{ reservation.location }}</a
              >
              <span v-else>{{ reservation.location }}</span>
            </template>
            <span v-else-if="variant === 'account'" class="consultation-details__pending">
              {{ t('consult.locationPending') }}
            </span>
          </dd>
        </div>
        <div>
          <dt>{{ t('consult.designField') }}</dt>
          <dd>{{ displayValue(reservation.designField) }}</dd>
        </div>
        <div>
          <dt>{{ t('consult.designFocus') }}</dt>
          <dd>{{ displayValue(reservation.designFocus) }}</dd>
        </div>
        <div>
          <dt>{{ t('consult.notes') }}</dt>
          <dd class="consultation-details__notes">{{ displayValue(reservation.notes) }}</dd>
        </div>
        <template v-if="variant === 'consultant'">
          <div>
            <dt>{{ t('consultantBookings.contact') }}</dt>
            <dd>
              <span v-if="reservation.contactName">{{ reservation.contactName }}<br /></span>
              <span>{{ reservation.contactEmail }}</span>
              <span v-if="reservation.contactPhone"><br />{{ reservation.contactPhone }}</span>
            </dd>
          </div>
          <div>
            <dt>{{ t('consultantBookings.statusLabel') }}</dt>
            <dd>{{ t(`consultantBookings.status.${reservation.status}`) }}</dd>
          </div>
          <div v-if="canEditLocation" class="consultation-details__location-edit">
            <dt :id="`location-label-${reservation.id}`">
              {{ isOnline ? t('consult.locationOnlineLabel') : t('consult.locationInPersonLabel') }}
            </dt>
            <dd>
              <input
                v-model="locationInput"
                data-testid="location-input"
                type="text"
                :maxlength="500"
                :aria-labelledby="`location-label-${reservation.id}`"
                :placeholder="
                  isOnline
                    ? t('consult.locationOnlinePlaceholder')
                    : t('consult.locationInPersonPlaceholder')
                "
                class="consultation-details__location-input"
              />
              <Button
                type="button"
                data-testid="location-save"
                class="mt-2"
                variant="secondary"
                :disabled="saving"
                @click="saveLocation"
              >
                {{ saving ? t('consult.savingLocation') : t('consult.saveLocation') }}
              </Button>
              <p v-if="locationError" class="consultation-details__location-error">
                {{ locationError }}
              </p>
              <p v-if="saveError" class="consultation-details__location-error">
                {{ saveError }}
              </p>
            </dd>
          </div>
        </template>
      </dl>
    </template>

    <ConsultationList v-else :reservations="reservations" />
  </article>
</template>

<style scoped>
.details-panel {
  position: absolute;
  right: 15%;
  top: calc(50% + 32px);
  z-index: 10;
  isolation: isolate;
  width: 440px;
  height: 500px;
  padding: 30px 46px 36px;
  border-radius: 36px;
  background-color: #16161961;
  transform: translateY(-50%);
}

.view-all {
  display: block;
  margin-left: auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f0ede6d1;
  font: inherit;
  font-size: 14px;
  font-weight: 300;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  cursor: pointer;
  transition: filter 180ms ease;
}

.view-all:is(:hover, :focus-visible) {
  filter: drop-shadow(0 0 7px #f0ede657);
}

.view-all span {
  margin-left: 4px;
}

.details-panel__date {
  display: grid;
  justify-items: end;
  margin-top: 38px;
  color: #f0ede6b8;
  font-weight: 200;
}

.details-panel__date time {
  font-size: 38px;
  letter-spacing: 0.025em;
}

.details-panel__date > span {
  margin-top: 3px;
  font-size: 20px;
}

.consultation-details {
  display: grid;
  gap: 17px;
  max-height: 280px;
  margin-top: 22px;
  overflow: hidden auto;
  padding-right: 8px;
  overscroll-behavior: contain;
  scrollbar-width: none;
}

.consultation-details div {
  min-width: 0;
}

.consultation-details dt,
.consultation-details dd {
  margin: 0;
  font-size: 15px;
  line-height: 1.42;
}

.consultation-details dt {
  color: #f0ede6e6;
  font-weight: 400;
}

.consultation-details dd {
  color: #f0ede6a8;
  font-weight: 300;
}

.consultation-details__notes {
  max-height: calc(1.42em * 3);
  overflow-y: auto;
  overscroll-behavior: contain;
  box-sizing: border-box;
  width: calc(100% + 40px);
  margin-right: -40px;
  padding-right: 8px;
  white-space: pre-wrap;
}

.details-panel--consultant {
  height: auto;
  max-height: 500px;
}

@media (max-width: 768px) {
  .details-panel {
    left: 8%;
    right: auto;
    top: 32%;
    width: 82%;
    height: auto;
    min-height: 0;
    /* 螢幕高度不足時卡片自己可捲動:外層 100svh + overflow hidden(軌道動畫固定版面),
       max-height 扣掉 top 32% 與底部安全間距,避免備註/聯絡資訊/狀態被截斷 */
    max-height: calc(100svh - 32% - 24px);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 32px 9vw 38px;
    transform: none;
  }
}

.consultation-details__pending {
  color: #f0ede680;
  font-size: 13px;
}

.consultation-details__location-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #f0ede633;
  border-radius: 8px;
  background: #ffffff0a;
  color: inherit;
  font: inherit;
}
.consultation-details__location-error {
  margin: 6px 0 0;
  color: var(--color-stellar-red, #e5484d);
  font-size: 13px;
}
</style>
