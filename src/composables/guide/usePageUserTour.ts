import { nextTick, type MaybeRefOrGetter } from 'vue';
import { useUserTour, type UserTourStep } from './useUserTour';
import {
  useUserTourPresenter,
  type UserTourShowOptions
} from './useUserTourPresenter';

export function usePageUserTour(userId: MaybeRefOrGetter<string | null | undefined>) {
  const tour = useUserTour(userId);
  const presenter = useUserTourPresenter(tour);

  async function showStep(
    step: UserTourStep,
    options?: UserTourShowOptions
  ): Promise<boolean> {
    await nextTick();
    return presenter.show(step, options);
  }

  return {
    ...tour,
    showStep,
    destroy: presenter.destroy,
    refresh: presenter.refresh
  };
}
