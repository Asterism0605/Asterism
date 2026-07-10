import { computed, ref, toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  getConsultationAvailabilityByMonth,
  getFutureConsultationDatesInMonth,
  getUnavailableConsultationTimeSlots,
  type ConsultationAvailabilityByDate
} from '@/services/consultation-availability.service';
import { useAuthStore } from '@/stores/auth.store';

export function useConsultationAvailability(selectedDate: MaybeRefOrGetter<string>) {
  const authStore = useAuthStore();
  const availabilityByDate = ref<ConsultationAvailabilityByDate>({});
  const loadedAvailabilityMonths = ref(new Set<string>());
  const pendingAvailabilityMonths = ref(new Set<string>());
  const visibleAvailabilityMonth = ref('');

  const accessToken = computed(() => authStore.session?.accessToken ?? '');
  const availabilityLoadingByDate = computed(() => {
    if (
      !visibleAvailabilityMonth.value ||
      !pendingAvailabilityMonths.value.has(visibleAvailabilityMonth.value)
    ) {
      return {};
    }

    return Object.fromEntries(
      getFutureConsultationDatesInMonth(visibleAvailabilityMonth.value)
        .filter((date) => !availabilityByDate.value[date])
        .map((date) => [date, true])
    );
  });
  const selectedDateAvailability = computed(() => {
    const date = toValue(selectedDate);

    return date ? availabilityByDate.value[date] : undefined;
  });
  const unavailableTimeSlots = computed(() =>
    getUnavailableConsultationTimeSlots(selectedDateAvailability.value)
  );

  async function loadAvailabilityForMonth(month: string) {
    if (
      !accessToken.value ||
      loadedAvailabilityMonths.value.has(month) ||
      pendingAvailabilityMonths.value.has(month)
    ) {
      return;
    }

    pendingAvailabilityMonths.value = new Set(pendingAvailabilityMonths.value).add(month);

    try {
      const nextAvailability = await getConsultationAvailabilityByMonth(month, accessToken.value);

      availabilityByDate.value = {
        ...availabilityByDate.value,
        ...nextAvailability
      };
      loadedAvailabilityMonths.value = new Set(loadedAvailabilityMonths.value).add(month);
    } catch {
      // Availability is an optimistic UX hint. Checkout remains the final booking guard.
    } finally {
      const nextPendingMonths = new Set(pendingAvailabilityMonths.value);
      nextPendingMonths.delete(month);
      pendingAvailabilityMonths.value = nextPendingMonths;
    }
  }

  function handleVisibleMonthChange(month: string) {
    visibleAvailabilityMonth.value = month;
    void loadAvailabilityForMonth(month);
  }

  watch(accessToken, () => {
    availabilityByDate.value = {};
    loadedAvailabilityMonths.value = new Set();
    pendingAvailabilityMonths.value = new Set();

    if (visibleAvailabilityMonth.value) {
      void loadAvailabilityForMonth(visibleAvailabilityMonth.value);
    }
  });

  return {
    availabilityByDate,
    availabilityLoadingByDate,
    unavailableTimeSlots,
    handleVisibleMonthChange
  };
}
