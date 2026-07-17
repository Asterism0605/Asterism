import { onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { USER_TOUR_STEP_COUNT, USER_TOUR_STEPS } from '@/constants/userTour';
import { createUserTourDriver } from '@/services/guide/userTourDriver';
import { requestUserTourPause } from '@/services/guide/userTourPause';
import type { UserTourStep, useUserTour } from './useUserTour';

type UserTourController = ReturnType<typeof useUserTour>;
const TARGET_READY_RETRY_FRAMES = 8;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export function useUserTourPresenter(tour: UserTourController) {
  const { locale, t } = useI18n();
  const presenter = createUserTourDriver();
  let showRequestId = 0;

  async function show(step: UserTourStep): Promise<boolean> {
    const definition = USER_TOUR_STEPS[step];
    if (!definition) return false;

    const requestId = ++showRequestId;

    for (let attempt = 0; attempt <= TARGET_READY_RETRY_FRAMES; attempt += 1) {
      if (
        requestId !== showRequestId ||
        tour.state.value.status !== 'active' ||
        tour.state.value.step !== step
      ) {
        return false;
      }

      const didShow = presenter.show({
        target: () => {
          const candidates = Array.from(document.querySelectorAll(definition.selector));
          return (
            candidates.find(
              (candidate) =>
                window.getComputedStyle(candidate).display !== 'none' &&
                candidate.getClientRects().length > 0
            ) ?? null
          );
        },
        title: t(definition.titleKey),
        description: t(definition.descriptionKey),
        sectionLabel: t(definition.sectionKey),
        progressLabel: t('userTour.progress', {
          current: definition.progress,
          total: USER_TOUR_STEP_COUNT
        }),
        pauseLabel: t('userTour.actions.pause'),
        nextLabel: definition.nextStep ? t('userTour.actions.next') : undefined,
        side: definition.side,
        align: definition.align,
        allowInteraction: definition.allowInteraction,
        onPause: () =>
          requestUserTourPause(() => {
            tour.pause();
            destroy();
          }),
        onNext: definition.nextStep
          ? () => {
              tour.advance(definition.nextStep as UserTourStep);
              void show(definition.nextStep as UserTourStep);
            }
          : undefined
      });

      if (didShow) return true;
      if (attempt < TARGET_READY_RETRY_FRAMES) await nextFrame();
    }

    return false;
  }

  function destroy(): void {
    showRequestId += 1;
    presenter.destroy();
  }

  onBeforeUnmount(destroy);

  watch(locale, () => {
    const step = tour.state.value.step;
    if (tour.state.value.status === 'active' && step && presenter.isActive()) void show(step);
  });

  return {
    show,
    destroy,
    refresh: presenter.refresh
  };
}
