import { onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { USER_TOUR_STEP_COUNT, USER_TOUR_STEPS } from '@/constants/userTour';
import { createUserTourDriver } from '@/services/guide/userTourDriver';
import { requestUserTourPause } from '@/services/guide/userTourPause';
import type { UserTourStep, useUserTour } from './useUserTour';

type UserTourController = ReturnType<typeof useUserTour>;
const TARGET_READY_RETRY_FRAMES = 8;

export interface UserTourShowOptions {
  onPrevious?: () => void;
  onComplete?: () => void;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export function useUserTourPresenter(tour: UserTourController) {
  const { locale, t } = useI18n();
  const presenter = createUserTourDriver();
  let showRequestId = 0;
  let activeShowOptions: UserTourShowOptions = {};

  async function show(
    step: UserTourStep,
    options: UserTourShowOptions = activeShowOptions
  ): Promise<boolean> {
    const definition = USER_TOUR_STEPS[step];
    if (!definition) return false;
    const descriptionKey =
      window.innerWidth < 768 && definition.mobileDescriptionKey
        ? definition.mobileDescriptionKey
        : definition.descriptionKey;

    activeShowOptions = options;
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
        description: t(descriptionKey),
        progressLabel: t('userTour.progress', {
          current: definition.progress,
          total: definition.total ?? USER_TOUR_STEP_COUNT
        }),
        previousLabel: definition.previousStep ? t('userTour.actions.previous') : undefined,
        nextLabel: definition.completeTour
          ? t('userTour.actions.done')
          : definition.nextStep
            ? t('userTour.actions.next')
            : undefined,
        closeLabel: t('userTour.actions.close'),
        side: definition.side,
        align: definition.align,
        allowInteraction: definition.allowInteraction,
        multiTargetSelector: definition.multiTargetSelector,
        centerPopover: definition.centerPopover,
        onPrevious: options.onPrevious,
        onClose: () =>
          requestUserTourPause(() => {
            tour.pause();
            destroy();
          }),
        onNext: definition.completeTour
          ? () => {
              if (options.onComplete) options.onComplete();
              else tour.complete();
              destroy();
            }
          : definition.nextStep
            ? () => {
              tour.advance(definition.nextStep as UserTourStep);
              void show(definition.nextStep as UserTourStep, options);
            }
            : undefined
      });

      if (didShow) return true;
      if (attempt < TARGET_READY_RETRY_FRAMES) await nextFrame();
    }

    if (tour.state.value.status === 'active' && tour.state.value.step === step) {
      tour.pause();
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
    if (tour.state.value.status === 'active' && step && presenter.isActive()) {
      void show(step, activeShowOptions);
    }
  });

  return {
    show,
    destroy,
    refresh: presenter.refresh
  };
}
