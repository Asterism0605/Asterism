import { onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { createUserTourDriver } from '../services/userTourDriver';
import { USER_TOUR_STEP_COUNT, USER_TOUR_STEPS } from '../constants/userTourSteps';
import { requestUserTourPause } from '../services/userTourPause';
import type { UserTourStep, useUserTour } from './useUserTour';

type UserTourController = ReturnType<typeof useUserTour>;

export function useUserTourPresenter(tour: UserTourController) {
  const { locale, t } = useI18n();
  const presenter = createUserTourDriver();

  function show(step: UserTourStep): boolean {
    const definition = USER_TOUR_STEPS[step];
    if (!definition) return false;

    return presenter.show({
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
          presenter.destroy();
        }),
      onNext: definition.nextStep
        ? () => {
            tour.advance(definition.nextStep as UserTourStep);
            if (!show(definition.nextStep as UserTourStep)) tour.pause();
          }
        : undefined
    });
  }

  onBeforeUnmount(presenter.destroy);

  watch(locale, () => {
    const step = tour.state.value.step;
    if (tour.state.value.status === 'active' && step && presenter.isActive()) show(step);
  });

  return {
    show,
    destroy: presenter.destroy,
    refresh: presenter.refresh
  };
}
